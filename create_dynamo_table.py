import boto3

def create_table():
    # We use localhost:8004 because this script runs on your Windows machine,
    # and port 8004 is mapped to the DynamoDB container in your docker-compose.
    dynamodb = boto3.resource(
        'dynamodb',
        region_name='us-east-1',
        endpoint_url='http://localhost:8004',
        aws_access_key_id='local',
        aws_secret_access_key='local'
    )

    try:
        table = dynamodb.create_table(
            TableName='ChatHistory',
            KeySchema=[
                {'AttributeName': 'RoomID', 'KeyType': 'HASH'},  # Partition key
                {'AttributeName': 'Timestamp', 'KeyType': 'RANGE'} # Sort key
            ],
            AttributeDefinitions=[
                {'AttributeName': 'RoomID', 'AttributeType': 'S'},
                {'AttributeName': 'Timestamp', 'AttributeType': 'S'}
            ],
            ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
        )
        print("Creating table...")
        table.meta.client.get_waiter('table_exists').wait(TableName='ChatHistory')
        print("Table 'ChatHistory' created successfully!")
    except Exception as e:
        if "ResourceInUseException" in str(e):
            print("Table 'ChatHistory' already exists.")
        else:
            print(f"Error: {e}")

if __name__ == "__main__":
    create_table()