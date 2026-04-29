// ============================================================================
// EXERCÍCIOS ADICIONAIS DE AGREGação MONGODB - NÍVEL INTERMEDIÁRIO/AVANÇADO
// Todos os exercícios resolvidos com comentários didáticos detalhados
// ============================================================================

// ----------------------------------------------------------------------------
// 6) Valor Total de Vendas por Mês e Ano
// Objetivo: Calcular o faturamento total agrupado por ano e mês de venda.
// ----------------------------------------------------------------------------
db.vendas.aggregate([
  {
    // Estágio 1: $addFields cria novos campos com data processada.
    // $dateToParts extrai componentes (ano, mês) de um campo de data.
    $addFields: {
      // Cria um objeto com ano e mês extraídos da data da venda.
      data_parts: {
        $dateToParts: { date: "$data_venda" }
      }
    }
  },
  {
    // Estágio 2: Agrupamos por ano E mês simultaneamente usando objeto composto.
    $group: {
      // _id é um OBJETO com múltiplos campos para agrupamento hierárquico.
      _id: {
        ano: "$data_parts.year",
        mes: "$data_parts.month"
      },
      
      // Somamos o valor total das vendas nesse período.
      faturamento_total: { $sum: "$valor" },
      
      // Contamos quantas vendas ocorreram.
      total_vendas: { $sum: 1 }
    }
  },
  {
    // Estágio 3: Ordenamos por ano e mês (mais recente primeiro).
    $sort: { 
      "_id.ano": -1, 
      "_id.mes": -1 
    }
  },
  {
    // Estágio 4: Formatamos o resultado para melhor legibilidade.
    $addFields: {
      periodo: {
        $concat: [
          { $toString: "$_id.ano" },
          "-",
          { $toString: "$_id.mes" }
        ]
      }
    }
  },
  {
    // Estágio 5: Reordenamos para colocar o período formatado primeiro.
    $project: {
      periodo: 1,
      faturamento_total: 1,
      total_vendas: 1,
      _id: 0
    }
  }
])

// ----------------------------------------------------------------------------
// 7) Clientes com Maior Ticket Médio (Top 5)
// Objetivo: Identificar os 5 clientes com maior valor médio por compra.
// ----------------------------------------------------------------------------
db.vendas.aggregate([
  {
    // Estágio 1: Agrupamos por cliente e calculamos múltiplos valores.
    $group: {
      _id: "$cliente_id",
      
      // Total faturado por esse cliente.
      total_faturado: { $sum: "$valor" },
      
      // Número total de compras realizadas.
      total_compras: { $sum: 1 }
    }
  },
  {
    // Estágio 2: Calculamos o ticket médio com $addFields.
    $addFields: {
      // Dividimos total faturado pelo número de compras.
      ticket_medio: { 
        $divide: ["$total_faturado", "$total_compras"] 
      }
    }
  },
  {
    // Estágio 3: Ordenamos pelo ticket médio (maior primeiro).
    $sort: { ticket_medio: -1 }
  },
  {
    // Estágio 4: Pegamos apenas os top 5.
    $limit: 5
  }
])

// ----------------------------------------------------------------------------
// 8) Produtos com Margem de Lucro Acima de 30%
// Objetivo: Listar produtos onde (preço_venda - custo) / custo > 30%.
// ----------------------------------------------------------------------------
db.produtos.aggregate([
  {
    // Estágio 1: Calculamos a margem de lucro com $addFields.
    $addFields: {
      // Margem = (preço_venda - custo) / custo * 100
      margem_lucro: {
        $multiply: [
          {
            $divide: [
              { $subtract: ["$preco_venda", "$custo"] },
              "$custo"
            ]
          },
          100
        ]
      }
    }
  },
  {
    // Estágio 2: Filtramos apenas produtos com margem > 30%.
    $match: {
      margem_lucro: { $gt: 30 }
    }
  },
  {
    // Estágio 3: Ordenamos pela maior margem.
    $sort: { margem_lucro: -1 }
  },
  {
    // Estágio 4: Mostramos apenas campos relevantes.
    $project: {
      nome: 1,
      preco_venda: 1,
      custo: 1,
      margem_lucro: { $round: ["$margem_lucro", 2] },
      _id: 0
    }
  }
])

// ----------------------------------------------------------------------------
// 9) Vendas por Faixa de Valor (Bucket Analysis)
// Objetivo: Classificar vendas em faixas: Baixa (<100), Média (100-500), Alta (>500).
// ----------------------------------------------------------------------------
db.vendas.aggregate([
  {
    // Estágio 1: Criamos faixas (buckets) com $bucket.
    $bucket: {
      groupBy: "$valor",                    // Campo numérico para criar faixas
      boundaries: [0, 100, 500, Infinity],  // Limites das faixas
      default: "Outros",                    // Para valores fora das faixas
      output: {
        // Contagem de vendas em cada faixa.
        total_vendas: { $sum: 1 },
        
        // Soma do valor total em cada faixa.
        faturamento: { $sum: "$valor" },
        
        // Lista dos produtos mais vendidos nessa faixa (apenas 3).
        top_produtos: { 
          $push: {
            nome: "$produto",
            valor: "$valor"
          }
        }
      }
    }
  },
  {
    // Estágio 2: Renomeamos as faixas para nomes mais amigáveis.
    $addFields: {
      faixa: {
        $switch: {
          branches: [
            { case: { $eq: ["$_id", 0] }, then: "Baixa (< R$100)" },
            { case: { $eq: ["$_id", 100] }, then: "Média (R$100-500)" },
            { case: { $eq: ["$_id", 500] }, then: "Alta (> R$500)" }
          ],
          default: "Outros"
        }
      }
    }
  },
  {
    // Estágio 3: Reordenamos campos e excluímos _id numérico.
    $project: {
      faixa: 1,
      total_vendas: 1,
      faturamento: 1,
      ticket_medio_faixa: {
        $divide: ["$faturamento", "$total_vendas"]
      },
      top_produtos: { $slice: ["$top_produtos", 3] },
      _id: 0
    }
  }
])

// ----------------------------------------------------------------------------
// 10) Relatório Completo: Receita por Região e Produto (Multi-Join)
// Objetivo: JOIN entre 3 coleções + agrupamento hierárquico complexo.
// ----------------------------------------------------------------------------
db.vendas.aggregate([
  {
    // Estágio 1: JOIN com clientes para pegar região.
    $lookup: {
      from: "clientes",
      localField: "cliente_id",
      foreignField: "_id",
      as: "cliente"
    }
  },
  {
    $unwind: "$cliente"
  },
  {
    // Estágio 2: JOIN com produtos para pegar categoria.
    $lookup: {
      from: "produtos",
      localField: "produto_id",
      foreignField: "_id",
      as: "produto"
    }
  },
  {
    $unwind: "$produto"
  },
  {
    // Estágio 3: Agrupamento hierárquico por região E categoria.
    $group: {
      _id: {
        regiao: "$cliente.regiao",
        categoria: "$produto.categoria"
      },
      
      // Total faturado nessa combinação.
      receita_total: { $sum: "$valor" },
      
      // Quantidade total vendida.
      qtd_total: { $sum: "$quantidade" },
      
      // Número de vendas.
      num_vendas: { $sum: 1 }
    }
  },
  {
    // Estágio 4: Ordenamos por receita (maior primeiro).
    $sort: { "receita_total": -1 }
  },
  {
    // Estágio 5: Formatamos para relatório final.
    $addFields: {
      ticket_medio: {
        $divide: ["$receita_total", "$num_vendas"]
      }
    }
  },
  {
    $project: {
      regiao: "$_id.regiao",
      categoria: "$_id.categoria",
      receita_total: 1,
      qtd_total: 1,
      num_vendas: 1,
      ticket_medio: { $round: ["$ticket_medio", 2] },
      _id: 0
    }
  }
])

// ----------------------------------------------------------------------------
// 11) Evolução Mensal de Vendas (Comparação Mês a Mês)
// Objetivo: Calcular variação % de vendas entre meses consecutivos.
// ----------------------------------------------------------------------------
db.vendas.aggregate([
  {
    $addFields: {
      mes_ano: {
        $dateToString: {
          format: "%Y-%m",
          date: "$data_venda"
        }
      }
    }
  },
  {
    $group: {
      _id: "$mes_ano",
      receita: { $sum: "$valor" },
      vendas: { $sum: 1 }
    }
  },
  {
    $sort: { _id: 1 }
  },
  {
    // Estágio crítico: $setWindowFields para cálculos de janela.
    $setWindowFields: {
      partitionBy: null,  // Não particionar (toda a coleção)
      sortBy: { _id: 1 },
      output: {
        // Receita do mês anterior.
        receita_anterior: {
          $shift: { output: "$receita", by: -1 }
        },
        
        // Vendas do mês anterior.
        vendas_anterior: {
          $shift: { output: "$vendas", by: -1 }
        }
      }
    }
  },
  {
    $addFields: {
      variacao_receita_pct: {
        $cond: {
          if: { $eq: ["$receita_anterior", null] },
          then: null,
          else: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ["$receita", "$receita_anterior"] },
                      "$receita_anterior"
                    ]
                  },
                  100
                ]
              },
              2
            ]
          }
        }
      }
    }
  },
  {
    $project: {
      periodo: "$_id",
      receita: 1,
      vendas: 1,
      variacao_receita_pct: 1,
      _id: 0
    }
  }
])