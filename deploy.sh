#!/bin/bash

# Atualiza o projeto com a branch main removendo a build, node_modules, containers antigos e restartando o processo.

echo "Atualizando projeto: Autosys - Web"

git pull && docker-compose down --remove-orphans && docker-compose up -d --build