//------------------------------------------------------------------------
// COMO JUNTAR DUAS COLEÇÕES? (Estrategias de Junção de Documentos)
//------------------------------------------------------------------------

// UMA COLEÇÃO DENTRO DA OUTRA (Guardar dados usando conceito de Embeding)
// como juntar duas coleções com embedding:

{
    "_id" : ObjectId("1234567890"),
        "item" : "Laptop",
            "price" : 1200,
                "user" : {
        "name" : "Anelize"
    }
}

// Em vez de salvar apenas o ID do usuário no pedido, você salva os dados 
// relevantes do user diretamente dentro do documento do pedido.
// Buscando o pedido do "Laptop", você já recebe "Anelize" no mesmo pacote.

//------------------------------------------------------------------------
// COMO JUNTAR DUAS COLEÇÕES: REFERENCE
//------------------------------------------------------------------------

/*  Se no exemplo anterior a Alice morava "dentro" do pedido, aqui ela tem
 a "casa" dela (coleção Users) e o pedido tem a dele (coleção Orders). Eles
 são ligados por um "fio", que é o ObjectId. */

// O Operador $lookup
/*  Pense no $lookup como um tradutor que segue o rastro:
1. Ele olha para o campo user_id no pedido.  
2. Vai até a coleção Users.  
3. Procura o documento que tem aquele _id.  
4. Traz os dados da Alice e anexa ao resultado do pedido de forma temporária. */

{       // Coleção Users (Usuarios)
    "_id" : ObjectId("0987654321")
    "name" : "Anelize"
}

{       // Coleção Orders (Pedidos)
    "_id" : ObjectId("1234567890"),
        "item" : "Laptop",
            "price" : 1200,
                "user_id" : ObjectId("0987654321") // Referencia ao objeto alice
}

db.orders.findOne(
    { _id: ObjectId("1234567890") }
)

db.users.findOne(
    { _id: ObjectId("0987654321") }
)

// o comando db.orders.aggregate indica que estamos iniciando uma "esteira
// de pensamentos" (pipeline). Os dados entram de um lado, passam por uma
// transformação e saem resumidos do outro
db.orders.aggregate([
    {
        $lookup: {
            from: "users",        // Coleção onde estão os dados extras (Users)
            localField: "user_id", // O "fio" que sai da coleção atual (Orders)
            foreignField: "_id", // Onde esse "fio" se conecta na outra coleção
            as: "user_info"  // Nome do novo campo que será criado com os dados
        }
    }
])


//------------------------------------------------------------------------------------------------------------------------------
// EXEMPLO DE FLUXO DE DADOS NA PIPELINE
//------------------------------------------------------------------------------------------------------------------------------

db.orders.aggregate([
    { $match: { ano: 2023 } }, // Filtra Documentos
    { $group: { _id: "mes", total: { $sum: "$valor" } } }, // Agrupa e soma
    { $sort: { total: -1 } } // ordena os resultados de forma crescente
])

//------------------------------------------------------------------------
// EMBBED OU REFERENCE
//------------------------------------------------------------------------

// A escolha por 
// referências é indicada para dados complexos que mudam com frequência, 
// visando evitar a duplicação e manter a normalização. Já a incorporação
//  é preferível para dados que são acessados simultaneamente e que
//  raramente sofrem alterações, pois sua grande vantagem é otimizar 
// drasticamente o desempenho de leitura ao eliminar a necessidade de
//  consultar múltiplas coleções.

//------------------------------------------------------------------------------------------------------------------------------
// USANDO OPERADOR $GROUP
//------------------------------------------------------------------------------------------------------------------------------

db.orders.aggregate([
    {
        $group: {
            _id: "$product_id", // Agrupa pelos IDs de produtos           ( Basicamente um "junte todos os documentos que possuem o mesmo ID de produto em um único bloco" )
            total_orders: { $sum: 1 }, // Conta o numero de Pedidos      ( Para cada documento encontrado no grupo, ele soma 1. )
            total_quantity: { $sum: "$quantity" } // Soma a quantidade de cada pedido
        }
    }
])

/*  Sem o $group, para saber o total de vendas de um produto, você teria 
que baixar milhares de documentos para o seu código e somar um por um 
manualmente. Com este operador, o MongoDB faz o cálculo pesado no servidor
e te entrega apenas o resultado final  */

//------------------------------------------------------------------------------------------------------------------------------
// APROFUNDANDO EM AGREGAÇÕES ( Mais do que juntar coleções )
// ESTÁGIOS DE AGREGAÇÃO
//------------------------------------------------------------------------------------------------------------------------------

// O estágio $match filtra os documentos de acordo com os critérios 
// especificados
db.vendas.aggregate([
    { $match: { ano: 2023 } }
])

//------------------------------------------------------------------------------------------------------------------------------

// O estágio $group agrupa documentos com base em um ou mais campos e 
// permite calcular agregados como soma, média, contagem, etc.
db.vendas.aggregate([
    { $group: { _id: "$mes", total_vendas: { $sum: "$valor" } } }
])

//------------------------------------------------------------------------------------------------------------------------------

// O estágio $project permite selecionar, incluir ou excluircampos 
// específicos nos documentos resultantes. Também podeser usado para criar
// novos campos ou transformar dados.
db.vendas.aggregate([
    { $project: { nome: 1, valor: 1, _id: 0 } }
]) // retornada nome e valor (true) e _id sera ocultado (false)

//------------------------------------------------------------------------------------------------------------------------------

// O estágio $sort ordena os documentos com base em um ou mais campos.
db.vendas.aggregate([
    { $sort: { valor: -1 } } // -1 decrescente / 1 crescente
])

//$limit: Restringe o número de documentos que passam para os estágios seguintes.
//$skip: Ignora um número especificado de documentos.
db.vendas.aggregate([
    { $sort: { valor: -1 } }, // ordena em forma decrescente
    { $skip: 5 }, // ignora os 5 primeiros documentos da lista 
    { $limit: 10 } // restringe a saida de documentos para 10
])

//------------------------------------------------------------------------------------------------------------------------------

// O estágio $unwind desestrutura um array, criando um documento para cada
// elemento do array.
db.pedidos.aggregate([
    { $unwind: "$itens" }
])

/* Em resumo: O $unwind é a ferramenta que "aplana" seus dados para que as
funções matemáticas e estatísticas consigam trabalhar sobre elementos que
antes estavam presos dentro de uma lista, ja que a maioria dos operadores
do MongoDB (como o $sum, $avg ou até o $sort) tem dificuldade em olhar 
para dentro de arrays. */

//------------------------------------------------------------------------------------------------------------------------------

// O estágio $facet permite executar múltiplas pipelines de agregação em
// paralelo e combinar os resultados.
db.vendas.aggregate([
    {
        $facet: {
            total_vendas: [{ $count: "count" }],
            soma_total: [{ $group: { _id: null, total: { sum: "valor" } } }]
        }
    }
])

//------------------------------------------------------------------------------------------------------------------------------

// $bucket: Agrupa documentos em intervalos predefinidos.
// $bucketAuto: Agrupa documentos em um número especificado de buckets automaticamente.

db.vendas.aggregate([
    {
        $bucket: {
            groupBy: "$valor", // Define qual campo será analisado para decidir em qual "balde" o documento cai.
            boundaries: [0, 100, 200, 300], // Estas são as gavetas. O MongoDB cria faixas assim: Faixa 1 - de 0 até 99.99 | Faixa 2: de 100 até 199.99 | Faixa 3: de 200 até 299.99.
            default: "Mais de 300", // Se um produto custar R$ 500, ele não entra nas faixas acima. O default evita que esse documento seja descartado, jogando-o em uma categoria extra.
            output: { total_vendas: { $sum: 1 }, soma_valores: { $sum: "$valor" } } // Aqui você define o que quer calcular para cada faixa (no caso, a contagem de vendas e a soma dos valores).
        }
    }
])

// No $bucketAuto, você apenas diz: "MongoDB, analise meus dados e 
// divida-os em 5 grupos da forma mais equilibrada possível". O banco 
// calcula as fronteiras sozinho para garantir que a distribuição seja uniforme.

//------------------------------------------------------------------------------------------------------------------------------

// $addFields: Adiciona novos campos aos documentos.
// $set: Similar ao $addFields, mas também pode modificar campos existentes.

db.vendas.aggregate([
    {
        $addFields: {
            total: { $multiply: ["quantidade", "preco_unitario"] }
        }
    }
])

// É semanticamente usado para enriquecer o documento. Você mantém tudo o
// que já existe e anexa novas informações geradas por cálculos ou lógica
// condicional, diferente do $set, que tem a intenção de sobrescrever um 
// valor existente ou atualizar um estado dentro da pipeline

//------------------------------------------------------------------------------------------------------------------------------

// O estágio $count adiciona um campo com o número total de documentos que
//  passaram pelo estágio anterior.
db.vendas.aggregate([
    { $count: "total_vendas" }
])
// Ele pega todos os documentos que sobreviveram às etapas anteriores da 
// sua agregação e os reduz a um único número, descartando todos os dados
// detalhados, embora você possa usar $group com $sum : 1, o $count é 
// semanticamente mais correto quando seu unico objetivo é saber quantos
// registros existem após um filtro

//------------------------------------------------------------------------------------------------------------------------------
// COMO TESTAR?
//------------------------------------------------------------------------------------------------------------------------------

db.vendas.aggregate([
    { $match: { ano: 2023 } },
    { $group: { _id: "$mes", total_vendas: { $sum: "$valor" } } },
    { $sort: { total_vendas: -1 } }
]).explain("executionStats")

//------------------------------------------------------------------------------------------------------------------------------
// OPERADORES DE AGREGAÇÃO
//------------------------------------------------------------------------------------------------------------------------------

$sum   // Soma os valores.          (No exemplo retornaria a soma de tudo em "valor")
$avg   // Calcula a média.          
$min   // Encontra o valor mínimo.  (No exemplo retornaria o menor valor)
$max   // Encontra o valor máximo.  (No exemplo retornaria o maior valor)
$first // Retorna o primeiro valor. (No exemplo retornaria o primeiro valor da lista)
$last  // Retorna o último valor.   (No exemplo retornaria o ultimo valor da lista)


// exemplo (Media de vendas do mês):
db.vendas.aggregate([
    { $group: { _id: "$mes", media_vendas: { $avg: "$valor" } } }
])

//------------------------------------------------------------------------------------------------------------------------------
// OPERADORES CONDICIONAIS
//------------------------------------------------------------------------------------------------------------------------------
// Permitem realizar operações condicionais, semelhantes a estruturas if-else:
/*  – $cond: Estrutura condicional.
    – $ifNull: Retorna um valor se o campo for nulo ou indefinido.
    – $switch: Implementa uma série de condições. (Ele para na primeira que for verdadeira.)                            */


// exemplo $cond:
db.vendas.aggregate([
    {
        $addFields: {
            acima_da_media: {
                $cond: { if: { $gt: ["valor", 1000] }, then: true, else: false }
            } // if olha para o campo valor, se (then) ele for maior que 
        }     // 1000("$gt"), grava o valor true no campo "acima_da_media"
    }
])

//exemplo $ifNull 
db.vendas.aggregate([
    {
        $addFields: {
            descricao_final: { $ifNull: ["$descricao", "Sem descrição"] }
        }  // Se o produto não tiver uma descrição cadastrada, mostrar
    }      // "Sem descrição".
])

// exemplo $switch
db.vendas.aggregate([
    {
        $addFields: {
            status_estoque: {
                $switch: {
                    branches: [
                        { case: { $eq: ["$qtd", 0] }, then: "ESGOTADO" },
                        { case: { $lte: ["$qtd", 5] }, then: "BAIXO ESTOQUE" }
                    ],
                    default: "ESTOQUE OK" // O que retorna se nenhuma das acima for real
                }
            }
        }
    }
])

//------------------------------------------------------------------------------------------------------------------------------
// OPERADORES DE ARRAY
//------------------------------------------------------------------------------------------------------------------------------

/*  • $push: Adiciona elementos a um array.
    • $addToSet: Adiciona elementos únicos a um array.
    • $filter: Filtra elementos de um array.
    • $map: Aplica uma expressão a cada elemento de um array.
    • $reduce: Reduz um array a um único valor.                */

// $push: Adiciona o elemento independentemente de ele já existir. É útil
// para históricos (ex: registrar cada vez que um cliente logou).
// exemplo push, Imagine que você quer registrar cada vez que um status de
// pedido muda, sem apagar o anterior:

db.venda.aggregate([
    {
        $group: {
            _id: "$pedido_id",
            historico_status: { $push: "status_atual" }
        } // Adiciona todos, inclusive repetidos
    }
])


// $addToSet
// Ideal para quando você quer listar categorias de produtos vendidos, mas
// não quer que a mesma categoria apareça duas vezes na lista.

db.venda.aggregate([
    {
        $group: {
            _id: "$clientes_id",
            categorias_compradas: { $addToSet: "categoria" }
        } // Se comprou 10 pizzas, "Pizza" aparece só uma vez
    }
])

// $filter
db.venda.aggregate([
    {
        $project: {
            itens_filtrados: {
                $filter: {
                    input: "itens",
                    as: "item",
                    cond: { $gt: [$$item.quantidade, 2] }
                }
            }
        }
    }
])

/*  O detalhe técnico importante: Note que o slide usa $$item (com dois 
    símbolos de cifrão). No MongoDB, dois cifrões indicam uma variável 
    interna criada dentro do operador (o "as"), enquanto um cifrão só 
    ($itens) indica um campo do documento original.                        */

// $map
// Serve para alterar cada item de uma lista individualmente. Vamos supor
// que você queira aplicar 10% de imposto em cada item de um array de 
// preços.

db.vendas.aggregate([
    {
        $project: {
            preços_com_imposto: {
                $map: {
                    input: "$precos_originais", // O array de entrada
                    as: "p", // Nome temporário de cada elemento
                    in: { $multiply: ["$$p", 1.1] } // A conta: preço * 1.1
                }
            }
        }
    }
])

// $reduce
// O $reduce percorre o array e vai acumulando um valor. Aqui, vamos somar
// todos os valores de uma lista de itens.
db.vendas.aggregate([
    {
        $project: {
            soma_total: {
                $reduce: {
                    input: "$itens_precos", // O array
                    initialValue: 0, // Começa em zero
                    in: { $add: ["$$value", "$$this"] } // Soma o acumulado ($$value) com o item atual ($$this)
                }
            }
        }
    }
])

// Resumo Visual da Diferença
// $filter: Você tem 5 itens, testa uma condição e sobram apenas 3.

// $map: Você tem 5 itens e transforma os 5 (ex: muda todos de "minúsculo"
// para "MAIÚSCULO").

// $reduce: Você tem 5 itens e no final tem apenas um único valor ]
// (ex: a soma de todos eles).