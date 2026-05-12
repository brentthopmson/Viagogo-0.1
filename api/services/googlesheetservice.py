import httpx
import json
import jwt
import time
import logging
import asyncio

logger = logging.getLogger(__name__)

class GoogleSheetService:
    def __init__(self, credentials_file, spreadsheet_id):
        self.credentials_file = credentials_file
        self.spreadsheet_id = spreadsheet_id
        self.token = self.authenticate()
        self.service = self.build_service()

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
            'scope': 'https://www.googleapis.com/auth/spreadsheets'
        }
        
        # Sign JWT
        signed_jwt = jwt.encode(jwt_payload, credentials['private_key'], algorithm='RS256')

        # Exchange JWT for access token
        token_response = httpx.post(
            credentials['token_uri'],
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            data={
                'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion': signed_jwt
            }
        )
        
        token_response_data = token_response.json()
        access_token = token_response_data.get('access_token')

        if not access_token:
            raise Exception("Failed to obtain access token")

        return access_token

    def build_service(self):
        return httpx.AsyncClient()

    async def get_all_sheets(self):
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{self.spreadsheet_id}"
        headers = {
            "Authorization": f"Bearer {self.token}"
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
        return response.json()

    async def get_sheet_by_name(self, sheet_name):
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{self.spreadsheet_id}/values/{sheet_name}"
        headers = {
            "Authorization": f"Bearer {self.token}"
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
        return response.json()

    async def get_sheet_range(self, sheet_name, range):
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{self.spreadsheet_id}/values/{sheet_name}!{range}"
        headers = {
            "Authorization": f"Bearer {self.token}"
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
        return response.json().get('values', [])

    async def get_sheet_rows_by_search(self, sheet_name, range, search_column, search_string):
        rows = await self.get_sheet_range(sheet_name, range)
        search_index = ord(search_column.upper()) - 65  # Convert column letter to index
        result = [row for row in rows if len(row) > search_index and row[search_index] == search_string]
        return result

    async def get_cell_value_by_search(self, sheet_name, range, search_column, search_string, cell_number):
        rows = await self.get_sheet_rows_by_search(sheet_name, range, search_column, search_string)
        cell_index = ord(cell_number.upper()) - 65  # Convert column letter to index
        if rows:
            return rows[0][cell_index] if len(rows[0]) > cell_index else None
        return None

    async def set_new_row(self, sheet_name, values):
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{self.spreadsheet_id}/values/{sheet_name}!A1:append"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        body = {
            'values': [values]
        }
        async with httpx.AsyncClient() as client:
            result = await client.post(url, headers=headers, json=body, params={"valueInputOption": "RAW"})
        return result.json()

    async def set_multiple_cell_data(self, sheet_name, range, search_column, search_value, column_value_map):
        rows = await self.get_sheet_rows_by_search(sheet_name, range, search_column, search_value)
        search_index = ord(search_column.upper()) - 65  # Convert column letter to index
        if not rows:
            return None

        for row in rows:
            if len(row) > search_index and row[search_index] == search_value:
                for column, value in column_value_map.items():
                    col_index = ord(column.upper()) - 65  # Convert column letter to index
                    if len(row) > col_index:
                        row[col_index] = value
                    else:
                        # If the column index is beyond the current row length, extend the row
                        row.extend([''] * (col_index - len(row) + 1))
                        row[col_index] = value

        body = {
            'values': rows
        }
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{self.spreadsheet_id}/values/{sheet_name}!{range}?valueInputOption=RAW"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        async with httpx.AsyncClient() as client:
            result = await client.put(url, headers=headers, json=body)
        return result.json()

# Example usage
if __name__ == "__main__":
    credentials_file = 'credentials.json'
    spreadsheet_id = '10FgeZkojbBwbCzeY2dNixWWpj-nZ4zQJJglqp9TuAuA'
    service = GoogleSheetService(credentials_file, spreadsheet_id)

    async def run_tests():
        # Testing different methods
        # print(await service.get_all_sheets())
        print(await service.get_sheet_by_name('Health'))
        # print(await service.get_sheet_range('Sheet1', 'A1:C3'))
        # print(await service.get_sheet_rows_by_search('Sheet1', 'A1:C10', 'A', 'search_string'))
        # print(await service.get_cell_value_by_search('Sheet1', 'A1:C10', 'A', 'search_string', 'B'))
        # print(await service.set_new_row('Sheet1', ['new', 'row', 'data']))
        # print(await service.set_multiple_cell_data('Sheet1', 'A1:C10', 'A', 'search_string', {'B': 'new_value', 'C': 'another_value'}))

    # Run the tests
    asyncio.run(run_tests())