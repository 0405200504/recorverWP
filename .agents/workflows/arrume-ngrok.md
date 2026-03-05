---
description: Reinicia o ngrok, obtém a nova URL pública e atualiza o projeto automaticamente
---

// turbo-all

## Passos

1. Verifique se o ngrok já está rodando:
```bash
curl -s http://localhost:4040/api/tunnels | python3 -c "import json,sys; d=json.load(sys.stdin); t=d.get('tunnels',[]); print(t[0]['public_url']) if t else print('OFFLINE')" 2>/dev/null || echo "OFFLINE"
```

2. Se estiver OFFLINE, mate processos antigos e inicie o ngrok novamente:
```bash
pkill -f ngrok || true
sleep 1
nohup /tmp/ngrok http 8083 --log=stdout > /tmp/ngrok.log 2>&1 &
sleep 6
```

3. Obtenha a nova URL pública do ngrok:
```bash
curl -s http://localhost:4040/api/tunnels | python3 -c "import json,sys; d=json.load(sys.stdin); t=d.get('tunnels',[]); print(next((x['public_url'] for x in t if 'https' in x.get('public_url','')), 'ERRO'))"
```

4. Atualize o arquivo `.env` do projeto (substitua a linha EVOLUTION_API_URL pela nova URL capturada no passo 3):
   - Edite `/Users/luiseduardofariafilho/Downloads/recuperei/.env`
   - Substitua o valor de `EVOLUTION_API_URL` pela nova URL

5. Verifique se a Evolution API está respondendo pela nova URL:
```bash
curl -s "NOVA_URL/" -H "apikey: 429683C4C977415CAAFCCE10F7D57E11" -H "ngrok-skip-browser-warning: true" | python3 -c "import json,sys; d=json.load(sys.stdin); print('✅ API OK - versão:', d.get('version'))"
```

6. Faça commit e push para o GitHub:
```bash
cd /Users/luiseduardofariafilho/Downloads/recuperei && git add .env && git commit -m "fix: atualiza EVOLUTION_API_URL ngrok" && git push origin main
```

7. Atualize a variável `EVOLUTION_API_URL` na Vercel usando o browser:
   - Abra https://vercel.com/dashboard
   - Vá em Settings → Environment Variables
   - Atualize `EVOLUTION_API_URL` com a nova URL do ngrok
   - Clique em "Redeploy" para aplicar

8. Confirme que tudo está funcionando e informe o usuário da nova URL ativa.
