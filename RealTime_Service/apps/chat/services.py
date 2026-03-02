import os

import boto3


def get_dynamodb_resource():
    # Inside Docker, use the service name 'dynamodb-local'
    endpoint = os.getenv("DYNAMODB_ENDPOINT") or None
    region = os.getenv("AWS_REGION", "ap-south-1")
    return boto3.resource(
        "dynamodb",
        region_name=region,
        endpoint_url=endpoint,
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )
