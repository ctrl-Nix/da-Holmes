from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
import httpx
import logging
import datetime
import re

router = APIRouter()
logger = logging.getLogger("holmes-crypto")

@router.get("/{address}")
async def track_crypto(request: Request, address: str):
    """
    Track a Bitcoin address using the free Blockchain.info API.
    Returns balance, total received, total sent, ticker rate, and transaction history.
    """
    address = address.strip()
    
    BTC_PATTERN = r'^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$'
    ETH_PATTERN = r'^0x[a-fA-F0-9]{40}$'
    if not re.match(BTC_PATTERN, address) and not re.match(ETH_PATTERN, address):
        raise HTTPException(
            status_code=400,
            detail="Invalid cryptocurrency address format."
        )
    
    # 1. Fetch BTC/USD price ticker
    btc_price_usd = 65000.0
    try:
        async with httpx.AsyncClient() as client:
            ticker_resp = await client.get("https://blockchain.info/ticker", timeout=3.0)
            if ticker_resp.status_code == 200:
                ticker_data = ticker_resp.json()
                btc_price_usd = float(ticker_data.get("USD", {}).get("last", 65000.0))
    except Exception as ticker_ex:
        logger.warning(f"Failed to fetch blockchain.info ticker: {ticker_ex}")

    # 2. Fetch address details
    try:
        url = f"https://blockchain.info/rawaddr/{address}"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=10.0)
            
            if resp.status_code == 200:
                data = resp.json()
                
                final_bal_sat = data.get("final_balance", 0)
                tot_recv_sat = data.get("total_received", 0)
                # Calculate total sent satoshis safely
                tot_sent_sat = data.get("total_sent")
                if tot_sent_sat is None:
                    tot_sent_sat = max(0, tot_recv_sat - final_bal_sat)
                
                final_bal_btc = final_bal_sat / 100000000.0
                tot_recv_btc = tot_recv_sat / 100000000.0
                tot_sent_btc = tot_sent_sat / 100000000.0
                
                # Fetch last 10 transactions
                raw_txs = data.get("txs", [])[:10]
                parsed_txs = []
                
                for tx in raw_txs:
                    tx_hash = tx.get("hash", "N/A")
                    unix_time = tx.get("time", 0)
                    dt_str = "N/A"
                    if unix_time > 0:
                        try:
                            dt_str = datetime.datetime.fromtimestamp(unix_time).strftime('%Y-%m-%d %H:%M:%S')
                        except Exception:
                            pass
                    
                    # Calculate net transfer amount for this address in the tx
                    # Inputs: look for matching input address
                    # Outputs: look for matching output address
                    address_input_val = 0
                    address_output_val = 0
                    
                    for item in tx.get("inputs", []):
                        prev_out = item.get("prev_out", {})
                        if prev_out.get("addr") == address:
                            address_input_val += prev_out.get("value", 0)
                            
                    for item in tx.get("out", []):
                        if item.get("addr") == address:
                            address_output_val += item.get("value", 0)
                            
                    net_sat = address_output_val - address_input_val
                    tx_amount_btc = abs(net_sat) / 100000000.0
                    direction = "IN" if net_sat >= 0 else "OUT"
                    
                    # Fallback if both inputs and outputs did not yield address match
                    if net_sat == 0:
                        # Fallback to result field if present
                        tx_result_sat = tx.get("result", 0)
                        tx_amount_btc = abs(tx_result_sat) / 100000000.0
                        direction = "IN" if tx_result_sat >= 0 else "OUT"
                        
                    parsed_txs.append({
                        "hash": tx_hash,
                        "time": dt_str,
                        "timestamp": unix_time,
                        "amount": tx_amount_btc,
                        "direction": direction
                    })

                return {
                    "status": "success",
                    "address": address,
                    "final_balance": final_bal_btc,
                    "final_balance_usd": final_bal_btc * btc_price_usd,
                    "total_received": tot_recv_btc,
                    "total_received_usd": tot_recv_btc * btc_price_usd,
                    "total_sent": tot_sent_btc,
                    "total_sent_usd": tot_sent_btc * btc_price_usd,
                    "n_tx": data.get("n_tx", 0),
                    "btc_price_usd": btc_price_usd,
                    "txs": parsed_txs
                }
            else:
                logger.warning(f"blockchain.info rawaddr returned non-200 code {resp.status_code}.")
                return JSONResponse(
                    status_code=503,
                    content={"status": "unavailable", "reason": "API unreachable"}
                )
    except Exception as e:
        logger.error(f"Blockchain rawaddr fetch error: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "unavailable", "reason": "API unreachable"}
        )
