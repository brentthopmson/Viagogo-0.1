import httpx
import json
import jwt
import time
from typing import Dict, Any

class GoogleDriveService:
    def __init__(self, credentials_file, parent_folder_id):
        self.credentials_file = credentials_file
        self.parent_folder_id = parent_folder_id
        self.token = self.authenticate()

    def authenticate(self):
        with open(self.credentials_file, "r") as f:
            credentials = json.load(f)
        
        # Create JWT payload
        now = int(time.time())
        jwt_payload = {
            'iss': credentials['client_email'],
            'sub': credentials['client_email'],
            'aud': credentials['token_uri'],
            'iat': now,
            'exp': now + 3600,  # Token valid for 1 hour
            'scope': 'https://www.googleapis.com/auth/drive'
        }
        
        # Sign JWT
        signed_jwt = jwt.encode(jwt_payload, credentials['private_key'], algorithm='RS256')

        # Exchange JWT for access token
        response = httpx.post(
            credentials['token_uri'],
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            data={
                'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion': signed_jwt
            }
        )
        token_response_data = response.json()
        access_token = token_response_data.get('access_token')

        if not access_token:
            raise Exception("Failed to obtain access token")

        return access_token

    async def create_subfolder(self, parent_folder_id, folder_name):
        url = "https://www.googleapis.com/drive/v3/files"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        body = {
            "name": folder_name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [parent_folder_id]
        }
        print(f"Creating subfolder in parent folder ID: {parent_folder_id}")
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=body)
            response_data = response.json()
            print(f"Create subfolder response: {response_data}")

            if response.status_code != 200:
                error_message = response_data.get('error', {}).get('message', 'Unknown error')
                raise Exception(f"Failed to create subfolder: {error_message} - Response: {response_data}")

            folder_id = response_data.get('id')
            if not folder_id:
                raise Exception("Subfolder creation response does not contain 'id'")

        return response_data

    async def upload_file(self, file_name, file_content, folder_id):
        url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json; charset=UTF-8"
        }
        metadata = {
            "name": file_name,
            "parents": [folder_id]
        }
        async with httpx.AsyncClient() as client:
            metadata_response = await client.post(url, headers=headers, json=metadata)
            metadata_data = metadata_response.json()
            print(f"File upload metadata response: {metadata_data}")

            if metadata_response.status_code != 200:
                error_message = metadata_data.get('error', {}).get('message', 'Unknown error')
                raise Exception(f"Failed to initiate file upload: {error_message} - Response: {metadata_data}")

            upload_url = metadata_data.get('uploadUrl')

            if not upload_url:
                raise Exception("Failed to get upload URL from metadata response")

            upload_response = await client.put(upload_url, headers=headers, content=file_content.encode('utf-8'))
            upload_response_data = upload_response.json()

            if upload_response.status_code != 200:
                error_message = upload_response_data.get('error', {}).get('message', 'Unknown error')
                raise Exception(f"Failed to upload file: {error_message} - Response: {upload_response_data}")

        return upload_response_data.get("webViewLink")
