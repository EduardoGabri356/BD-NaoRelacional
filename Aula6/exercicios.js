// ============================================================================
// RESOLUÇÃO DOS EXERCÍCIOS DE AGREGAÇÃO MONGODB
// ============================================================================

// ----------------------------------------------------------------------------
// 1) Contagem de Vendas por Cliente
// Objetivo: Calcular quantas vendas cada cliente realizou.
// ----------------------------------------------------------------------------
db.vendas.aggregate([
  {
    // O operador $group agrupa documentos baseados em uma chave específica.
    // Aqui, a chave (_id) é o ID do cliente. Usamos o cifrão "$" para indicar
    // que "cliente_id" é o valor de um campo do documento, e não um texto fixo.
    $group: {
      _id: "$cliente_id",
      
      // Para cada documento encontrado nesse grupo (mesmo cliente), o $sum 
      // adiciona 1. O resultado final será a contagem de pedidos desse cliente.
      total_vendas: { $sum: 1 }
    }
  }
])

// ----------------------------------------------------------------------------
// 2) Média de Vendas por Produto
// Objetivo: Determinar a média de vendas para cada tipo de produto.
// ----------------------------------------------------------------------------
db.vendas.aggregate([
  {
    // Primeiro, agrupamos os documentos pelo nome ou ID do produto.
    $group: {
      _id: "$produto",
      
      // O operador $avg calcula a média matemática de um campo numérico.
      // Assumindo que a coleção tem um campo "valor" representando o preço da venda,
      // ele somará todos os valores desse produto e dividirá pela quantidade de vendas.
      media_valor_vendas: { $avg: "$valor" }
    }
  }
])

// ----------------------------------------------------------------------------
// 3) Listar Clientes que Compraram Mais de 5 Produtos
// Objetivo: Identificar clientes que realizaram grandes pedidos.
// ----------------------------------------------------------------------------
db.vendas.aggregate([
  {
    // Estágio 1: Agrupamos por cliente para saber o total que cada um comprou.
    $group: {
      _id: "$cliente_id",
      
      // Se a coleção tiver um campo "quantidade" em cada venda, somamos esse campo.
      // (Se fosse apenas contar os pedidos, usaríamos { $sum: 1 } como no ex. 1)
      total_produtos: { $sum: "$quantidade" }
    }
  },
  {
    // Estágio 2: O $match atua como um filtro após o agrupamento.
    // Ele avalia os documentos gerados pelo $group anterior e só deixa passar
    // para a próxima etapa aqueles que atenderem à condição.
    $match: {
      // Filtramos onde o "total_produtos" calculado acima seja maior que ($gt) 5.
      total_produtos: { $gt: 5 }
    }
  }
])

// ----------------------------------------------------------------------------
// 4) Top 3 Produtos Mais Vendidos
// Objetivo: Encontrar os produtos com maior número de vendas.
// ----------------------------------------------------------------------------
db.vendas.aggregate([
  {
    // Estágio 1: Juntamos as vendas por produto e somamos a quantidade.
    $group: {
      _id: "$produto",
      total_vendido: { $sum: "$quantidade" }
    }
  },
  {
    // Estágio 2: O $sort organiza os resultados. 
    // Usamos -1 no campo "total_vendido" para ordenar de forma DECRESCENTE
    // (do maior para o menor), garantindo que os mais vendidos fiquem no topo.
    $sort: { total_vendido: -1 }
  },
  {
    // Estágio 3: Como queremos apenas o "Top 3", o $limit corta a lista
    // e retorna exclusivamente os 3 primeiros documentos da ordenação.
    $limit: 3
  }
])

// ----------------------------------------------------------------------------
// 5) Total de Vendas por Região
// Objetivo: Calcular o total de vendas por região (usando $lookup).
// ----------------------------------------------------------------------------
db.pedidos.aggregate([
  {
    // Estágio 1: $lookup faz o "JOIN", buscando dados em outra coleção.
    // Estamos na coleção "pedidos" e vamos buscar a "regiao" na coleção "clientes".
    $lookup: {
      from: "clientes",          // A coleção onde vamos buscar a informação extra.
      localField: "cliente_id",  // A chave estrangeira na coleção atual (pedidos).
      foreignField: "_id",       // A chave primária na coleção de destino (clientes).
      as: "dados_do_cliente"     // Nome do novo array que guardará o resultado do match.
    }
  },
  {
    // Estágio 2: O $lookup sempre retorna um array (mesmo que ache só 1 cliente).
    // O $unwind "desestrutura" esse array, transformando-o em um objeto embutido.
    // Isso é essencial para conseguirmos acessar o campo "regiao" facilmente depois.
    $unwind: "$dados_do_cliente"
  },
  {
    // Estágio 3: Agora que os dados estão mesclados, podemos agrupar.
    // Acessamos o campo "regiao" navegando dentro do objeto criado pelo $lookup.
    $group: {
      _id: "$dados_do_cliente.regiao",
      
      // Somamos o campo "valor" (do pedido original) para ter a receita total da região.
      receita_total_regiao: { $sum: "$valor" }
    }
  }
])