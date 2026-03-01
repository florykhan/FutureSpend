from pydantic import BaseModel
from datetime import datetime
import random


mock_db={
    "user_123":{
        "balance":2500.00,
        "vault_locked":False,
        "transactions":[
            {"date": "2026-02-25", "description": "Starbucks", "amount": -5.75},
            {"date": "2026-02-24", "description": "Uber", "amount": -12.50},
            {"date": "2026-02-23", "description": "Grocery store", "amount": -85.32},
            {"date": "2026-02-22", "description": "Salary deposit", "amount": 2000.00}
        ]
    }
}

class BankResponse(BaseModel):
    success:bool
    message:str
    data:dict=None



def get_balance(user_id:str="user_123"):
    if user_id not in mock_db:
        mock_db[user_id]={
            "balance":random.randint(1000, 5000),
            "vault_locked":False,
            "transactions":[]
        }
    
    return BankResponse(
        success=True,
        message="Balance retrieved",
        data={"balance": mock_db[user_id]["balance"]}
    )


def lock_vault(user_id:str="user_123"):
    if user_id not in mock_db:
        mock_db[user_id]={"balance":2500,"vault_locked":False,"transactions":[]}
    mock_db[user_id]["vault_locked"]=True
    
    return BankResponse(
        success=True,
        message="Vault locked successfully",
        data={"vault_locked": True}
    )


def unlock_vault(user_id: str="user_123"):
    if user_id not in mock_db:
        mock_db[user_id]={"balance":2500,"vault_locked":False,"transactions":[]}
    mock_db[user_id]["vault_locked"]=False
    
    return BankResponse(
        success=True,
        message="Vault unlocked successfully",
        data={"vault_locked": False}
    )


def get_transactions(user_id: str="user_123", limit: int=10):
    if user_id not in mock_db:
        mock_db[user_id]={"balance":2500,"vault_locked":False,"transactions":[]}
    
    recent=mock_db[user_id]["transactions"][-limit:]
    
    return BankResponse(
        success=True,
        message="Transactions retrieved",
        data={"transactions": recent}
    )