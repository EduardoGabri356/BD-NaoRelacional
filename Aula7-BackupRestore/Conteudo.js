// Backup e restore no mongoDB
// são operadores fundamentais para garantir a integridade e a recuperação de dados em casos de falhas, erros humani ou migração

// Os componentes principais do mongo db são:
// -- mongodump -> exporta um banco de dados
// -- mongorestore -> importa um backup feito pelo mongo dump

/* BOAS PRÁTICAS EM BACKUP
    ✓Sempre teste seus backups: não adianta ter backup se ele não pode
    ser restaurado.

    ✓Use scripts automatizados (com cron, por exemplo) para fazer
    backups regulares. No Windows, use o agendador de tarefas.

    ✓Guarde os backups em locais seguros (outro disco, serviço em
    nuvem).

    ✓Em produção, considere usar replicação e snapshots para minimizar o
    downtime.
*/
//--------------------------------------------------------------------
// BACKUP DO BANCO DE DADOS (Cópia dos dados)
//--------------------------------------------------------------------

// Comando básico:
mongodump --out /caminho/do/Backup

// Comando com parametros:
mongodump --db nomeDoBanco -- collection nomeDaColecao -- out /caminho/do/banco

// Comando com autenticação:
mongodump --
    url="mongodb://usuario:senha@host:porta/nomeDoBanco" -- out /caminho/do/banco

//--------------------------------------------------------------------
// parametros para mongoDB
//--------------------------------------------------------------------

--db // define o banco a ser exportado
//exemplo:
--db loja

//--------------------------------------------------------------------

--collection // Exporta apenas uma coleção expecifica
//exemplo:
--colletion clientes

//--------------------------------------------------------------------

--query // aplica filtro nos documentos (JSON)
// Exemplo:
--query '{ "status": "ativo" }'

//--------------------------------------------------------------------

--excludeCollection // exclui uma ou mais coleções
//exemplo:
--excludeCollection logs

//--------------------------------------------------------------------

--excludeCollectionWithPrefix // exclui coleções que começam com um certo prefixo
// exemplo:
--excludeCollectionWithPrefix tmp_

//--------------------------------------------------------------------
// AUTENTICAÇÃO E CONEXÃO NO mongodump
//--------------------------------------------------------------------

--uri //Conecta via URI padrão mongoDB
// exemplo:
--uri="mongodb://usuario:senha@localhost:27017/loja"

//--------------------------------------------------------------------

--host //define o endereço e porta
// exemplo:
--host localhost:27017

//--------------------------------------------------------------------

--username, --password, --authenticationDatabase // Para autenticação manual
// exemplo:
-- username admin --password 123 --authenticationDatabase admin

//--------------------------------------------------------------------

--ssl // Usa conexão segura (TSL/SSL)
/* exemplo: */ --ssl

//--------------------------------------------------------------------
// DESTINO DO BACKUP
//--------------------------------------------------------------------

--out // Define o diretório onde salvará os asrquivos BSON
//exemplo:
--out ./meu_backup

//--------------------------------------------------------------------

--archive // Gera um único arquivo de backup (ideal para compactar e mover)
--archive=backup.archive

//--------------------------------------------------------------------

--gzip // Comprime os arquivos BSON ao gerar, geralmente usado com --archive
// exemplo:
--gzip

//--------------------------------------------------------------------
// CONTROLE DE CONSISTÊNCIA E TEMPO
//--------------------------------------------------------------------

--oplog // Inclui o Oplog para backups consistentes em replica sets

//--------------------------------------------------------------------

--numParallelCollections // Número de coleções a exportar simultaneamente
--numParallelCollections 4

//--------------------------------------------------------------------

--readPreference // Escolhe de qual nó ler (primário/secundário)
//exemplo:
--readPreference=secondary

//--------------------------------------------------------------------
// PARÂMETROS PARA TESTE E DEBUG
//--------------------------------------------------------------------

--quiet // Oculta saidas no terminal

//--------------------------------------------------------------------

--verbose // exibe detalhes da operação

//--------------------------------------------------------------------

--help // Momstra todos os parametros disponiveis

//--------------------------------------------------------------------
//  EXEMPLO mongodump COM VÁRIOS PARÂMETROS
//--------------------------------------------------------------------

mongodump
    --uri="mongodb://usuario:senha@localhost:27017/loja" //Conecta via URI padrão mongoDB
    --collection vendas                                  // Exoprta apenas uma coleção expecifica, no caso a coleção "vendas"
    --query '{"ano": 2025}'                              // aplica filtro nos documentos (JSON), neste caso, todos os itens do ano 2025
    --out ./backups/loja                                 // Define o diretório onde salvará os asrquivos BSON, aqui serão salvos em "loja"
    --gzip                                               // Comprime os arquivos BSON ao gerar
    --archive=vendas2024.archive                         // Gera um único arquivo de backup

//--------------------------------------------------------------------
// RESTORE(“Voltar” o banco de dados com base em um backup)
//--------------------------------------------------------------------
// RESTAURAR BACKUPS FEITOS COM mongodump COM mongorestore
//--------------------------------------------------------------------

// restaurar um banco inteiro:
mongorestore /caminho/do/banco

//restaurar uma coleção especifica:
mongorestore --db nomeDoBanco --collection nomeDaColecao /caminho/do/backup/nomeDoBanco/nomeDaColecao

// restaurar e sobscrever dados existentes:
mongorestore --drop /caminho/do/backup
// O --drop remove os dados existentes antes de restaurar.

//--------------------------------------------------------------------
// Origem dos dados
//--------------------------------------------------------------------

// --dir ou --nsInclude (Pastas contendo os arquivos BSON)
// exemplo:
mongorestore .meu_backup

//--------------------------------------------------------------------

--archive // Restaura a partir de um unico arquivo
--archive=nackup.archive

//--------------------------------------------------------------------

--gzip // Lê arquivos campactados com gzip

//--------------------------------------------------------------------
// FILTROS DE RESTAURAÇÃO
//--------------------------------------------------------------------

--db // define em qual banco os dados serão restaurados
// exemplo:
--db loja

//--------------------------------------------------------------------

--collection // restaura uma unica coleção
// exemplo:
--collection produtos

//--------------------------------------------------------------------

--nsInclude // restaura apenas namespaces (banco.coleção) especificos
// exemplo:
--nsInclude loja.vendas

//--------------------------------------------------------------------

--nsExclude // Exclui deeterminados namespaces
// exemplo:
--nsExclude logs.*

//--------------------------------------------------------------------
// COMPORTAMENTOS DE RESTAURAÇÃO
//--------------------------------------------------------------------

--drop // Remove coleções existentes antes de restaurar

//--------------------------------------------------------------------

--maintainInsertionOrder // mantem a ordem dos documentos

//--------------------------------------------------------------------

--preserveUUID // Preserva o UUID das coleções (util em sharded clusters)

//--------------------------------------------------------------------
// CONEXÃO E AUTENTICAÇÃO
//--------------------------------------------------------------------

--uri // conecta com URI completa
// exemplo:
--uri="mongodb://usuario:senha@localhost:27017"

//--------------------------------------------------------------------

--host // Define o host manualmente
// exemplo:
--host localhost:27017

//--------------------------------------------------------------------

--username, --password, --authenticationDatabase // autenticação manual
// exemplo:
--username admin --authenticationDatabase admin

//--------------------------------------------------------------------
// AJUSTES DE DESEMPENHO
//--------------------------------------------------------------------

--numInsertionWorkersPerCollection // numero de threads de inserção por coleção
// exemplo:
--numInsertionWorkersPerCollection 4

//--------------------------------------------------------------------

--writeConcern // Define o nivel de confirmação de escrita
// exemplo:
--writeConcern=majority

//--------------------------------------------------------------------

--batchSize // numero de documetnos por lote de inserção
--batchSize=1000

//--------------------------------------------------------------------
// DEPURAÇÃO DE AJUDA
//--------------------------------------------------------------------

--dryRun // Simula a restauração sem executar (somente para validações com Atlas)

//--------------------------------------------------------------------

--verbose // exibe mais detalhes

//--------------------------------------------------------------------

--quiet // oculta saidas

//--------------------------------------------------------------------

--help // mostra todos os parametros disponiveis
// exemplo:
mongorestore --help

//--------------------------------------------------------------------
// EXEMPLO COM PARÂMETROS mongorestore
//--------------------------------------------------------------------
mongorestore
    --uri="mongodb://usuario:senha@localhost:27017"
    --db loja
    --collection vendas
    --drop
    --gzip
    --archive=vendas2025.archive
//--------------------------------------------------------------------