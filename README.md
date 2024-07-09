# Projeto Frontend com Next e React

## Descrição

Este projeto é uma aplicação frontend responsiva, desenvolvida usando NextJS e React que se conecta a um backend monolitico para consumir e manipular dados. O projeto é ideal para empresas do ramo automotivo, permitindo o cadastro e consulta de clientes, serviços e automóveis.

## Estrutura do Projeto

- **Frontend**: Desenvolvido em NextJS e React

## Pré-requisitos

- Node.js (versão 20.2.1)
- npm (Node Package Manager)
- React (versão 18.2.0)
- Next (versão 13.4.3)
- Docker e Docker Compose

### Execução do projeto

Para executar o projeto:
```bash
# Instale o Node.js (caso não tenha)
# Para sistemas baseados em Debian/Ubuntu:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Para sistemas baseados em Red Hat/CentOS:
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Instale o Nest CLI globalmente
npm install -g @nestjs/cli@^9.0.0

# Instale as dependências:
npm install
```

## Comandos Úteis

Para rodar o projeto em modo de desenvolvimento:
```bash
npm run dev
```

Para fazer o build do projeto:
```bash
npm run build
```

Para rodar o projeto em produção:
```bash
npm start
```