from flask import Flask, request, jsonify, send_from_directory
import mercadopago
import requests as req
import uuid
import os

app = Flask(__name__, static_folder='.', static_url_path='')

# =====================================================================
#  CONFIGURAÇÕES — lidas de variáveis de ambiente (Railway)
# =====================================================================
MP_ACCESS_TOKEN  = os.environ.get("MP_ACCESS_TOKEN",  "APP_USR-541007577080389-040515-d0596c847609f2584efc414854df5622-3313855818")
MP_PUBLIC_KEY    = os.environ.get("MP_PUBLIC_KEY",    "APP_USR-d004f765-abfc-465f-a641-55336eb87947")
CALLMEBOT_PHONE  = os.environ.get("CALLMEBOT_PHONE",  "558387846147")
CALLMEBOT_APIKEY = os.environ.get("CALLMEBOT_APIKEY", "1417081")
BASE_URL         = os.environ.get("BASE_URL",         "https://francoveronterapias.com.br")
CURSO_NOME       = "Método Vital Flow"
CURSO_PRECO      = 899.00
DOWNLOAD_LINK    = os.environ.get("DOWNLOAD_LINK",    "https://drive.google.com/SEU_LINK_DO_CURSO")
# =====================================================================

sdk = mercadopago.SDK(MP_ACCESS_TOKEN)

# --- Modelos 3D ---
@app.route('/models/<path:filename>')
def models(filename):
    return send_from_directory('models', filename)

# --- Páginas estáticas ---
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/checkout')
def checkout():
    return send_from_directory('.', 'checkout.html')

# --- Retorna a public key pro frontend ---
@app.route('/api/config')
def config():
    return jsonify({"public_key": MP_PUBLIC_KEY, "preco": CURSO_PRECO})

# --- Processa pagamento (cartão, Pix, boleto) sem redirecionar ---
@app.route('/api/processar-pagamento', methods=['POST'])
def processar_pagamento():
    data  = request.json or {}
    nome  = data.get('nome', 'Cliente')
    email = data.get('email', 'cliente@email.com')

    # Dados base do pagamento
    payment_data = {
        "transaction_amount": CURSO_PRECO,
        "description": CURSO_NOME,
        "payment_method_id": data.get("payment_method_id"),
        "payer": {
            "email": email,
            "first_name": nome.split()[0] if nome else "Cliente",
            "last_name": " ".join(nome.split()[1:]) if len(nome.split()) > 1 else "",
        },
        "metadata": {"idempotency_key": str(uuid.uuid4())}
    }

    # Cartão de crédito/débito — usa token
    if data.get("token"):
        payment_data["token"]        = data["token"]
        payment_data["installments"] = data.get("installments", 1)
        payment_data["issuer_id"]    = data.get("issuer_id")

    # Pix / boleto — sem token
    if data.get("payment_method_id") in ["pix", "bolbradesco", "pec"]:
        if data.get("payer"):
            payment_data["payer"].update(data["payer"])

    result   = sdk.payment().create(payment_data)
    payment  = result.get("response", {})
    status   = payment.get("status", "error")
    pay_id   = payment.get("id", "")

    # Pagamento aprovado (cartão)
    if status == "approved":
        _notificar_whatsapp(nome, email, CURSO_PRECO, pay_id, "Cartão")
        return jsonify({"status": "approved", "payment_id": pay_id})

    # Pix pendente — devolve QR code para exibir na página
    if status in ("pending", "in_process"):
        poi = payment.get("point_of_interaction", {})
        td  = poi.get("transaction_data", {})
        return jsonify({
            "status":           "pending",
            "payment_id":       pay_id,
            "qr_code":          td.get("qr_code", ""),
            "qr_code_base64":   td.get("qr_code_base64", ""),
            "ticket_url":       payment.get("transaction_details", {}).get("external_resource_url", "")
        })

    # Erro
    detail = payment.get("status_detail", "Erro desconhecido")
    return jsonify({"status": "error", "message": detail}), 400

# --- Verificar status do pagamento Pix (polling) ---
@app.route('/api/verificar-pagamento/<payment_id>')
def verificar_pagamento(payment_id):
    response = sdk.payment().get(payment_id)
    payment  = response.get("response", {})
    return jsonify({"status": payment.get("status", "unknown")})

# --- Webhook Mercado Pago ---
@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json or {}
    if data.get("type") == "payment":
        pay_id   = data["data"]["id"]
        response = sdk.payment().get(pay_id)
        payment  = response.get("response", {})
        if payment.get("status") == "approved":
            nome  = payment.get("payer", {}).get("first_name", "Cliente")
            email = payment.get("payer", {}).get("email", "—")
            valor = payment.get("transaction_amount", CURSO_PRECO)
            metodo = payment.get("payment_method_id", "—")
            _notificar_whatsapp(nome, email, valor, pay_id, metodo)
    return jsonify({"status": "ok"}), 200

# --- Página de sucesso ---
@app.route('/sucesso')
def sucesso():
    pay_id = request.args.get('payment_id', '')
    with open('success.html', 'r', encoding='utf-8') as f:
        html = f.read()
    html = html.replace('{{DOWNLOAD_LINK}}', DOWNLOAD_LINK)
    html = html.replace('{{PAYMENT_ID}}', pay_id)
    return html

# --- CallMeBot ---
def _notificar_whatsapp(nome, email, valor, pay_id, metodo):
    msg = (
        f"✅ *VENDA REALIZADA!*\n\n"
        f"📚 Curso: {CURSO_NOME}\n"
        f"👤 Nome: {nome}\n"
        f"📧 Email: {email}\n"
        f"💳 Método: {metodo}\n"
        f"💰 Valor: R$ {float(valor):.2f}\n"
        f"🔑 ID: {pay_id}"
    )
    try:
        req.get(
            "https://api.callmebot.com/whatsapp.php",
            params={"phone": CALLMEBOT_PHONE, "text": msg, "apikey": CALLMEBOT_APIKEY},
            timeout=10
        )
    except Exception as e:
        print(f"[WhatsApp] Erro: {e}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
