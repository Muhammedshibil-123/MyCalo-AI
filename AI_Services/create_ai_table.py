import boto3
import os

def create_ai_history_table():
    # Use the SERVICE name 'dynamodb-local' instead of the container name
    endpoint = os.getenv('DYNAMODB_ENDPOINT', 'http://dynamodb-local:8000')
    
    dynamodb = boto3.resource(
        'dynamodb',
        region_name='us-east-1',
        endpoint_url=endpoint,
        aws_access_key_id='local',
        aws_secret_access_key='local'
    )

    try:
        table = dynamodb.create_table(
            TableName='AIChatHistory',
            KeySchema=[
                {'AttributeName': 'RoomID', 'KeyType': 'HASH'},
                {'AttributeName': 'Timestamp', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'RoomID', 'AttributeType': 'S'},
                {'AttributeName': 'Timestamp', 'AttributeType': 'S'}
            ],
            ProvisionedThroughput={
                'ReadCapacityUnits': 5,
                'WriteCapacityUnits': 5
            }
        )
        table.meta.client.get_waiter('table_exists').wait(TableName='AIChatHistory')
        print("✅ Table 'AIChatHistory' created successfully!")
    except Exception as e:
        if "ResourceInUseException" in str(e):
            print("⚠️ Table 'AIChatHistory' already exists.")
        else:
            print(f"❌ Error creating table: {e}")

if __name__ == "__main__":
    create_ai_history_table()