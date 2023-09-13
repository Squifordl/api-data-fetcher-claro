# API Data Fetcher

Este repositório contém um script que faz requisições para uma API, coletando dados de diferentes parâmetros e combinações, e armazena-os localmente.

## Recursos

- Coleta de dados baseada na seleção de estados brasileiros.
- Tentativas automáticas em caso de falhas na requisição.
- Registro do progresso para retomar a execução em caso de interrupções.

## Pré-requisitos

- Node.js
- Arquivo `cidades.json`

## Como usar

1. Clone o repositório.
2. Navegue até a pasta do projeto.
3. Execute o script usando o comando `node nome_do_script.js`.
4. Quando solicitado, insira os estados brasileiros dos quais deseja obter os dados. Você pode inserir vários estados separando-os por vírgulas ou usar `ALL` para todos os estados.
![Imagem]('https://prnt.sc/Ups4cT2A8Mir')
5. O script começará a coleta de dados e salvará os resultados na pasta `./data/`.

## Estrutura do Projeto

- As constantes no início do arquivo definem os parâmetros da coleta, como empresas, tipos de cliente, tipos de venda e tipos de pessoa.
- A constante `estadosBrasileiros` lista todos os estados brasileiros.
- O script usa o módulo `readline` para interagir com o usuário e solicitar os estados de interesse.
- A função `requestAPI` é responsável por fazer as requisições.
- Funções auxiliares como `saveProgress`, `loadProgress` e `clearProgress` ajudam a gerenciar o progresso da coleta, permitindo retomar de onde parou em caso de interrupção.

## Avisos

- Certifique-se de ter um token de acesso válido na constante de headers `Authorization` antes de executar o script.
- **Importante**: Fique atento ao limite de requisições diárias estabelecido pela API. Exceder esse limite pode resultar no bloqueio temporário ou permanente do seu usuário. Recomendamos sempre verificar a documentação da API e, se possível, inserir pausas entre as requisições para evitar atingir o limite rapidamente.

---

Este script foi criado e desenvolvido por Squiford.
