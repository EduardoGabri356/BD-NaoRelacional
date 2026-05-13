//----------------------------------------------------------
// IMPORTANDO E EXPORTANDO DADOS NO MONGODB
//----------------------------------------------------------
mongoimport // insere dados em uma coleção a partir de um arquivo externo

mongoexport // exporta dados de uma coleção do MongoDB para um arquivo 
// .json ou .csv
//----------------------------------------------------------
// IMPORTANDO DADOS COM MONGOIMPORT
//----------------------------------------------------------

// importar um arquivo JSON
mongoimport --db loja -- collection produtos --file produtos.json
// O arquivo deve ter um JSON por linha (não um array)


// Importar JSON em formato de array
mongoimport --db loja -- collection produtos --file produtos.json 
--jsonArray
// Use -jsonArray se o arquivo for um array JSON completo: [{...}, {...}, ...]


// Importar CSV com cabeçalho
mongoimport --db escola --collection alunos --type csv --file alunos.csv
--headerline
// O --headerline usa a primeira linha como nomes de campos


// Importar CSV sem cabeçalho
mongoimport --db escola --collection alunos --type csv -
-file alunos.csv --fields nome,idade,turma


// Importar com autenticação
mongoimport --
uri="mongodb://usuario:senha@localhost:27017/escola" 
--collection alunos --file alunos.json www.tiago.blog.br

//----------------------------------------------------------
// PARÂMETROS GERAIS DO MONGOIMPORT
//----------------------------------------------------------

--uri 
// Conecta usadno uma URI completa (util para autenticação e conexões remotas)

--host 
// Endereço do servidor MongoDB (localhost:27017)

--port 
// Porta de conexão, normalmente 27017

--username 
--password 
// Autenticação (Quando exigida)

--authenticationDatabase
// Define p banco de authenticação (quando diferente do banco-alvo)

//----------------------------------------------------------
// CONTROLE DOS ARQUIVOS
//----------------------------------------------------------

--file 
// Caminho para o arquivo de entrada

--type
// Tipo de arquivo: json(padrão), csv ou tsv

-- headerline 
// Para arquivos CSV/TSV: usa a primeira linha como nomes dos campos

--fields 
//Lista os campos explicitamente (usado com CSV/TSV se não houver headerline)

--jsonArray
// Indica que o arquivo JSON é um array de documentos (ex: [{...}, {...}])

//----------------------------------------------------------
// COMPORTAMENTO DE INSERÇÃO
//----------------------------------------------------------

--drop
// Remove a coleção antes de importar os dados. CUIDADO: apaga dados existentes

--upsert 
// Atualiza documetnos com baso em um campo chave;
// insere se não existir

--upsertFields 
//Lista os campos que serão usados como chave para o upsert

--mode
// Controla o modo de escrita: insert, upset ou merge. (Disponivel nas 
// Database Tools mais recentes)

--stopOnError 
// Interrompe a importação se ocorrer um erro (por padrão, ele continua)

--maintainInsertionOrder
// Mantem a ordem original dados dos documentos durante inserção

//----------------------------------------------------------
// PERFORMACE E CONFIGURAÇÃO
//----------------------------------------------------------

--numInsertionWorkers 
// Número de threads de inserção paralela (padrão: Número de nucleos)

--writeConcern
// Define a política de gravação (ex: {w:1},{w:"majority"}).

--bypassDocumentValidation
// Ignora validações definidas em schema da coleção.

--ignoreBlanks
// (CSV) Ignora campos em branco ao importar.

//----------------------------------------------------------
// EXEMPLO DE MONGOIMPORT COM VÁRIOS PARÂMETROS
//----------------------------------------------------------

mongoimport
    --db escola // acessa o banco escola
    --collection alunos // na coleção alunos
    --file alunos.csv // caminho para o arquivo
    --type csv // tipo do arquivo
    --headerline // usa a primeira linha como nome do campo
    --drop // remove a coleção antes de importar os dados
    --numInsertionWorkers 4 // seta o numero de nucleos em 4
    --stopOnError // para quando der erro

//----------------------------------------------------------
// EXPORTANDO OS DADOS
//----------------------------------------------------------
// EXPORTANDO DADOS COM MONGOEXPORT
//----------------------------------------------------------

// Exportar uma coleção inteira para JSON:
mongoexport --db loja --collection produtos --out produtos.json

// Exportar uma coleção com filtro (apenas produtos ativos)
mongoexport --db loja --collection produtos --query '{"ativo": true}' --out ativos.json

// Exportar para CSV com campos específicos
mongoexport --db escola --collection alunos --type=csv --fields nome,idade,turma --out alunos.csv

// Exportar com autenticação
mongoexport --uri="mongodb://usuario:senha@localhost:27017/escola" -- collection alunos --out alunos.json

//----------------------------------------------------------
// PARÂMETROS DE CONEXÃO DO MONGOEXPORT
//----------------------------------------------------------

--uri
// URI completa para conexão (útil para autenticação e conexões remotas).

--host 
// Host do servidor MongoDB (ex: localhost:27017).

--port
// Porta do servidor MongoDB (padrão: 27017).

--username 
--password 
// Credenciais de autenticação.

--authenticationDatabase 
// Nome do banco onde o usuário está registrado.

//----------------------------------------------------------
// CONTROLE DE SAÍDA DO MONGOEXPORT
//----------------------------------------------------------

--out 
// Caminho e nome do arquivo de saída.

--type 
// Tipo de saída: json (padrão) ou csv.

--jsonArray 
// Exporta os documentos como um array JSON (usado apenas no tipo JSON)

--pretty 
// Formata o JSON com indentação legível.

//----------------------------------------------------------
// CONTROLE DE DADOS EXPORTADOS
//----------------------------------------------------------

--query 
// Filtra os documentos com uma condição (em formato JSON).

--fields
// Lista de campos a serem exportados, separados por vírgula. Obrigatório para CSV.

--fieldFile 
// Caminho para um arquivo .txt contendo os nomes dos campos, um por linha.

--sort
// Ordena os documentos antes de exportar (ex: {"nome": 1}).

--skip 
// Pula os N primeiros documentos.

--limit 
// Limita a quantidade de documentos exportados.

--noHeaderLine 
// (CSV) Não exporta o cabeçalho com os nomes dos campos.

//----------------------------------------------------------
// EXEMPLO DE MONGOEXPORT COM VÁRIOS PARÂMETROS
//----------------------------------------------------------

mongoexport
    --db escola // acessa o banco escola
    --collection alunos // na coleção alunos
    --type=csv // tipo csv
    --fields nome,idade,curso // lista de campos para serem exportados
    --query '{"curso": "Informática"}' // Filtra documentos, passa apenas cursos que tem "informatica"
    --sort '{"idade": -1}' // Ordena em forma decrescente
    --out alunos_informatica.csv // caminho e nome do arquivo de saida

//----------------------------------------------------------