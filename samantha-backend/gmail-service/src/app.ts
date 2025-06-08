import { google } from 'googleapis';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoDb = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoDb);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const getAuthUrl = async () => {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ authUrl })
  };
};

export const handleCallback = async (event: any) => {
  const { code } = JSON.parse(event.body);
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store tokens in DynamoDB
    await docClient.send(new PutCommand({
      TableName: process.env.TOKENS_TABLE,
      Item: {
        userId: event.requestContext.authorizer.claims.sub,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date
      }
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Gmail connected successfully' })
    };
  } catch (error) {
    console.error('Error handling callback:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to connect Gmail' })
    };
  }
};

export const getLastEmail = async (event: any) => {
  try {
    // Get tokens from DynamoDB
    const result = await docClient.send(new GetCommand({
      TableName: process.env.TOKENS_TABLE,
      Key: {
        userId: event.requestContext.authorizer.claims.sub
      }
    }));

    if (!result.Item) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Gmail not connected' })
      };
    }

    oauth2Client.setCredentials({
      access_token: result.Item.accessToken,
      refresh_token: result.Item.refreshToken,
      expiry_date: result.Item.expiryDate
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 1
    });

    if (!response.data.messages || response.data.messages.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'No emails found' })
      };
    }

    const message = await gmail.users.messages.get({
      userId: 'me',
      id: response.data.messages[0].id
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: message.data })
    };
  } catch (error) {
    console.error('Error getting last email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to get last email' })
    };
  }
}; 