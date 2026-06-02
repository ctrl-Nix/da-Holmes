import os
import logging
import asyncio
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

logger = logging.getLogger("holmes.telegram")

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "🚨 *Holmes OSINT Framework* 🚨\n\n"
        "Send /scan <target> to run a God-Mode investigation from your phone.",
        parse_mode="Markdown"
    )

async def scan(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not context.args:
        await update.message.reply_text("Usage: /scan <target>")
        return
        
    target = context.args[0]
    await update.message.reply_text(f"🔍 Initiating God-Mode scan on {target}...\nThis may take a minute.")
    
    # Run scan via UnifiedScanner
    try:
        from app.services.unified_scanner import UnifiedScanner
        scanner = UnifiedScanner()
        results = await scanner.scan(target)
        
        findings = results.get("data", {})
        summary = f"✅ *Scan Complete: {target}*\n\n"
        
        # Pull top 5 key findings to send back to chat
        count = 0
        for k, v in findings.items():
            if isinstance(v, (str, int, float)):
                summary += f"• {k}: {str(v)[:50]}\n"
                count += 1
            if count >= 5:
                break
                
        summary += "\nCheck the web dashboard for full details."
        await update.message.reply_text(summary, parse_mode="Markdown")
        
    except Exception as e:
        await update.message.reply_text(f"❌ Scan failed: {e}")

async def run_bot_polling():
    if not TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN not set. Telegram Bot is disabled.")
        return
        
    try:
        application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
        application.add_handler(CommandHandler("start", start))
        application.add_handler(CommandHandler("scan", scan))
        
        logger.info("Starting Telegram Bot Polling...")
        await application.initialize()
        await application.start()
        await application.updater.start_polling()
        
        # Keep running
        while True:
            await asyncio.sleep(3600)
    except Exception as e:
        logger.error(f"Telegram Bot crashed: {e}")
