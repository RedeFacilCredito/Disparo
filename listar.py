import os

# Caminho da pasta do projeto
diretorio_base = "/home/eduardo-disparo/leadsflow/backend/"
# Nome do arquivo de saída
arquivo_saida = "saida_projeto.txt"

# Pastas e arquivos a ignorar
pastas_ignoradas = {"node_modules", ".git", ".vscode", "__pycache__"}
arquivos_ignorados = {"package-lock.json"}

# Limite opcional de tamanho do arquivo (em bytes), para evitar arquivos muito grandes
TAMANHO_MAXIMO = 1 * 1024 * 1024  # 1 MB

with open(arquivo_saida, "w", encoding="utf-8") as saida:
    for root, dirs, files in os.walk(diretorio_base):
        # Remove pastas indesejadas
        dirs[:] = [d for d in dirs if d not in pastas_ignoradas]

        for nome_arquivo in files:
            if nome_arquivo in arquivos_ignorados:
                continue

            caminho_arquivo = os.path.join(root, nome_arquivo)

            try:
                if os.path.getsize(caminho_arquivo) > TAMANHO_MAXIMO:
                    continue

                with open(caminho_arquivo, "r", encoding="utf-8") as f:
                    conteudo = f.read()

                caminho_relativo = os.path.relpath(caminho_arquivo, diretorio_base)
                saida.write(f"\n--- Arquivo: {caminho_relativo} ---\n")
                saida.write(conteudo + "\n")

            except Exception as e:
                print(f"Erro ao ler {caminho_arquivo}: {e}")