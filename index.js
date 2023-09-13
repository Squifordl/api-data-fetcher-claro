const https = require('https');
const fs = require('fs');
const path = require('path');
const cidadesJSON = require('./cidades.json');
const inquirer = require('inquirer');

const empresas = ['CLARO', 'NET'];
const tiposCliente = ['EMPRESARIAL', 'HOTEL_HOSPITAL', 'RESIDENCIAL'];
const tiposVenda = {
  'EMPRESARIAL': ['PROSPECT'],
  'HOTEL_HOSPITAL': ['PROSPECT'],
  'RESIDENCIAL': ['PROSPECT']
};

const tiposPessoa = {
  'EMPRESARIAL': ['CPF', 'CNPJ']
};

const RETRY_DELAY = 5000;
const REQUEST_DELAY = 5000;
const MAX_RETRIES = 3;
const PROGRESS_FILE = './progress.json';

const estadosBrasileiros = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO", "ALL"];

inquirer
  .prompt([
    {
      type: 'checkbox',
      name: 'estados',
      message: 'Quais estados gostaria de buscar? (Pressione <espaço> para selecionar, <a> para alternar todos, <i> para inverter seleção)',
      choices: estadosBrasileiros,
      default: ['ALL']
    }
  ])
  .then(answers => {
    console.log('Estados selecionados:', answers.estados);

    let estadosSelecionados = answers.estados;

    if (estadosSelecionados.includes('ALL')) {
      estadosSelecionados = estadosBrasileiros.filter(e => e !== 'ALL');
    }

    const cidadesFiltradas = cidadesJSON.cidades.cidades.filter(cidade => estadosSelecionados.includes(cidade.uf));
    const queue = [];

    const saveProgress = (item) => {
      if (fs.existsSync(PROGRESS_FILE)) {
        const existingData = fs.readFileSync(PROGRESS_FILE, 'utf8');
        if (JSON.stringify(item) === existingData) {
          return;
        }
      }
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(item));
    };


    const loadProgress = () => {
      if (fs.existsSync(PROGRESS_FILE)) {
        return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
      }
      return null;
    };

    const clearProgress = () => {
      if (fs.existsSync(PROGRESS_FILE)) {
        fs.unlinkSync(PROGRESS_FILE);
      }
    };

    const processQueue = () => {
      if (queue.length === 0) {
        console.log("Todos os itens da fila foram processados.");
        clearProgress();
        return;
      }

      const item = queue.shift();
      saveProgress(item);
      requestAPI(item.empresa, item.tipoCliente, item.tipoVenda, item.tipoPessoa, item.pathString, item.cidade, 0);
    };

    const previousProgress = loadProgress();
    const startIndex = previousProgress ? cidadesJSON.cidades.cidades.findIndex(cidade => cidade.id === previousProgress.cidade.id) + 1 : 0;

    cidadesFiltradas.slice(startIndex).forEach(cidade => {
      empresas.forEach(empresa => {
        tiposCliente.forEach(tipoCliente => {
          tiposVenda[tipoCliente].forEach(tipoVenda => {
            let tipoPessoaOptions = [''];

            if (tiposPessoa[tipoCliente]) {
              tipoPessoaOptions = tiposPessoa[tipoCliente];
            }

            tipoPessoaOptions.forEach(tipoPessoa => {
              const pathString = `/api/simulador?tipoConsulta=CIDADE&cidadeId=${cidade.id}&node=&condicoesPorNode=false&isLoadingCondicoesPorNode=false&hasChipExpress=false&isLoadingChipExpress=false&openFilters=true&empresa=${empresa}&tipoCliente=${tipoCliente}&tipoVenda=${tipoVenda}&tipoPessoa=${tipoPessoa}&disableEmpresa=false&disableTipoVenda=false&isVendaDuplicada=false&produtosMigracao=`;
              queue.push({
                empresa,
                tipoCliente,
                tipoVenda,
                tipoPessoa,
                pathString,
                cidade
              });
            });
          });
        });
      });
    });

    const requestAPI = (empresa, tipoCliente, tipoVenda, tipoPessoa, pathString, cidade, retryCount) => {
      if (retryCount >= MAX_RETRIES) {
        console.error(`Máximo de tentativas atingido para a cidade ${cidade.nome}, ${cidade.uf} com combinação ${empresa}/${tipoCliente}/${tipoVenda}/${tipoPessoa}. Prosseguindo com a próxima cidade.`);
        processQueue();
        return;
      }

      const options = {
        hostname: 'simulador-api.conexaoclarobrasil.com.br',
        port: 443,
        path: pathString,
        method: 'GET',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'pt-BR,pt;q=0.9',
          'Authorization': 'Bearer TOKEN_HERE'
        },
        insecureHTTPParser: true
      };

      const req = https.request(options, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          const responseJSON = JSON.parse(data);
          if (responseJSON.error || responseJSON.message || responseJSON.status === 500) {
            console.error(`Erro no response para a cidade ${cidade.nome}, ${cidade.uf} com combinação ${empresa}/${tipoCliente}/${tipoVenda}/${tipoPessoa}: ${data}`);
            processQueue();
            return;
          }

          const dirPath = `./data/${empresa}/${tipoCliente}/${tipoVenda}/${tipoPessoa}/${cidade.uf}`;
          fs.mkdirSync(dirPath, { recursive: true });

          fs.writeFileSync(path.join(dirPath, `${cidade.nome}.json`), JSON.stringify(JSON.parse(data), null, 2));
          console.log(`Dados obtidos para a cidade ${cidade.nome}, ${cidade.uf} com combinação ${empresa}/${tipoCliente}/${tipoVenda}/${tipoPessoa}`);

          setTimeout(processQueue, REQUEST_DELAY);
        });
      });

      req.on('error', error => {
        console.error(`Erro ao obter dados para a cidade ${cidade.nome}, ${cidade.uf} com combinação ${empresa}/${tipoCliente}/${tipoVenda}/${tipoPessoa} na tentativa ${retryCount + 1}. Retentando...`, error);
        setTimeout(() => requestAPI(empresa, tipoCliente, tipoVenda, tipoPessoa, pathString, cidade, retryCount + 1), RETRY_DELAY);
      });

      req.end();
    };

    processQueue();

  });