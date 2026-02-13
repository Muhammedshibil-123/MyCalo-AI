import boto3
import os

def get_dynamodb_resource():
    # Inside Docker, use the service name 'dynamodb-local'
    endpoint = os.getenv('DYNAMODB_ENDPOINT', 'http://dynamodb-local:8000')
    return boto3.resource(
        'dynamodb',
        region_name='us-east-1',
        endpoint_url=endpoint,
        aws_access_key_id='local',
        aws_secret_access_key='local'
    )