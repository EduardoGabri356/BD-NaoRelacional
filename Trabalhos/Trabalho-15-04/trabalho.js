// ============================================================================
// ETAPA DE ORGANIZAÇÃO E LIMPEZA (ETL) - SISTEMA DETRAN
// Objetivo: Transformar o "rascunho" bagunçado na coleção oficial "veiculos_certo"
// ============================================================================

db.veiculos_rascunho.aggregate([
    // PASSO 1: Se o rascunho tiver multas em um array e quisermos uma linha por multa,
    // usamos o $unwind. Se quisermos manter o veículo único, pulamos este passo.
    // Referência: Slide "Operador $unwind (Desestruturar)"
    {
        $unwind: {
            path: "$historico_multas",
            preserveNullAndEmptyArrays: true // Mantém o veículo mesmo se ele não tiver multas
        }
    },

    // PASSO 2: A "Grande Arrumação" (Projeção e Tratamento)
    {
        $project: {
            _id: 0, // Removemos o ID antigo para o MongoDB gerar um novo e limpo no $out
            
            // Padronização de campos simples
            placa: "$info.placa_veiculo",
            modelo: "$info.modelo_nome",
            
            // TRATAMENTO DE NULOS: Se a cor não existir, define como "PADRÃO"
            // Referência: Slide "Operadores Condicionais" ($ifNull)
            cor: { $ifNull: ["$estetica.cor_predominante", "PADRÃO"] },

            // LÓGICA CONDICIONAL: Já categoriza o veículo para facilitar buscas futuras
            // Referência: Slide "Operadores Condicionais" ($cond)
            categoria_ipva: {
                $cond: {
                    if: { $gte: ["$valores.ipva", 2500] },
                    then: "ALTO CUSTO",
                    else: "POPULAR"
                }
            },

            // ORGANIZAÇÃO DE DATA: Garantindo que a data de licenciamento esteja no topo
            data_limite: "$prazos.licenciamento_anual"
        }
    },

    // PASSO 3: Filtro de Integridade
    // Só passamos para a coleção oficial veículos que tenham placa (dado obrigatório)
    {
        $match: {
            placa: { $exists: true, $ne: null }
        }
    },

    // PASSO 4: Gravação Final
    // Cria (ou sobrescreve) a coleção "veiculos_certo" com tudo arrumado
    {
        $out: "veiculos_certo"
    }
]);

// ============================================================================
// PÓS-PROCESSAMENTO (Essencial para a Performance!)
// ============================================================================

// Após rodar o aggregate acima, precisamos criar o índice.
// Sem isso, qualquer busca futura será um COLLSCAN lento.
// Referência: Slide "Script de Teste de Performance"
db.veiculos_certo.createIndex({ placa: 1 });



// ============================================================================
// PASSO 2: Cruzamento de Dados (Veículos + Proprietários)
// Objetivo: Identificar o responsável legal por cada veículo "limpo"
// ============================================================================

db.veiculos_certo.aggregate([
    {
        // O $lookup funciona como um "procura-se" em outra coleção
        // Referência: Slide "Operador $lookup"
        $lookup: {
            from: "proprietarios",       // Coleção de onde virão os dados extras
            localField: "proprietario_id", // Campo que temos na 'veiculos_certo'
            foreignField: "_id",          // Campo correspondente na 'proprietarios'
            as: "dados_proprietario"      // Nome do array que será criado com o resultado
        }
    },
    {
        // Como o $lookup sempre devolve uma lista [], usamos o $unwind para "achatar"
        // Transformamos o array em um objeto único para facilitar o acesso
        // Referência: Slide "Operador $unwind"
        $unwind: "$dados_proprietario"
    },
    {
        // Agora limpamos o resultado final para mostrar apenas o que interessa ao guarda
        $project: {
            placa: 1,
            modelo: 1,
            cor: 1,
            nome_dono: "$dados_proprietario.nome",
            cpf_dono: "$dados_proprietario.cpf",
            _id: 0
        }
    }
]);

// ============================================================================
// PASSO 3: Criando a Tabela de Agentes (Lógica do Professor)
// Objetivo: Gerar 5 agentes aleatórios para fiscalização
// ============================================================================

db.pessoas_rascunho.aggregate([
    {
        $project: {
            _id: 0,
            nome_agente: "$nome", // Pega o nome da base de rascunho
            
            // Cria um ID de crachá aleatório entre 1000 e 9999
            crachá: {
                $floor: { $multiply: [{ $rand: {} }, 9000] }
            },
            
            // Define o setor de atuação de forma fixa ou aleatória
            setor: "FISCALIZAÇÃO URBANA"
        }
    },
    { $limit: 5 }, // Garante que teremos apenas 5 agentes no sistema
    { $out: "agentes_oficiais" } // Grava na nova coleção
]);

// ============================================================================
// REALIZAÇÃO DE EXERCICIOS
// ============================================================================
// 1 - Qual modelo de carro que tem mais multas?
db.veiculos_certo.aggregate([
    {
        // Agrupamos pelo nome do modelo e somamos 1 para cada veículo com multa
        $group: {
            _id: "$modelo",
            total_multas: { $sum: 1 } 
        }
    },
    { $sort: { total_multas: -1 } }, // Do maior para o menor
    { $limit: 1 } // Pega apenas o primeiro da lista
]);

// ============================================================================

// 2 - Quantas multas por cidade?
db.veiculos_certo.aggregate([
    {
        // Buscamos a cidade na coleção que você organizou anteriormente
        $lookup: {
            from: "cidades_certo",
            localField: "cidade_id", // Campo no veículo
            foreignField: "_id",     // Campo na cidade
            as: "info_cidade"
        }
    },
    { $unwind: "$info_cidade" },
    {
        $group: {
            _id: "$info_cidade.nome_cidade",
            quantidade: { $sum: 1 }
        }
    },
    { $sort: { quantidade: -1 } }
]);

// ============================================================================

// 3 - Qual é a infração mais aplicada?
db.multas_registradas.aggregate([
    {
        $group: {
            _id: "$tipo_infracao", // Ex: "Excesso de Velocidade"
            contagem: { $sum: 1 }
        }
    },
    { $sort: { contagem: -1 } },
    { $limit: 1 }
]);

// ============================================================================

// 4 - Qual mes do ano tem mais multas?
db.multas_registradas.aggregate([
    {
        // Estágio 1: Extraímos apenas o mês da data da multa
        $project: {
            mes: { $month: "$data_multa" } // Retorna um número de 1 a 12
        }
    },
    {
        // Estágio 2: Agrupamos pelo número do mês
        $group: {
            _id: "$mes",
            total_no_mes: { $sum: 1 }
        }
    },
    {
        // Estágio 3: Ordenamos para ver qual mês aparece mais
        $sort: { total_no_mes: -1 }
    },
    { $limit: 1 } // O campeão de multas
]);

// ============================================================================

// 5 - Qual é a cor de veículo mais multada?
db.veiculos_certo.aggregate([
    {
        $group: {
            _id: "$cor",
            total: { $sum: 1 }
        }
    },
    { $sort: { total: -1 } },
    { $limit: 1 }
]);

// ============================================================================

// 6 - Qual agente aplica mais multas?
db.multas_registradas.aggregate([
    {
        // Cruzamos a multa com o agente que a aplicou
        $lookup: {
            from: "agentes_oficiais",
            localField: "agente_id",
            foreignField: "crachá",
            as: "agente"
        }
    },
    { $unwind: "$agente" },
    {
        $group: {
            _id: "$agente.nome_agente",
            multas_aplicadas: { $sum: 1 }
        }
    },
    { $sort: { multas_aplicadas: -1 } },
    { $limit: 1 }
]);

// ============================================================================

// 7 - Qual sexo é mais multado?
db.multas_registradas.aggregate([
    {
        // Passo 1: Cruzamos a multa com o dono do veículo
        $lookup: {
            from: "proprietarios",
            localField: "proprietario_id",
            foreignField: "_id",
            as: "info_dono"
        }
    },
    { $unwind: "$info_dono" }, // Tiramos do array para acessar o campo 'sexo'
    {
        // Passo 2: Agrupamos pelo campo sexo que veio da outra coleção
        $group: {
            _id: "$info_dono.sexo",
            contagem: { $sum: 1 }
        }
    },
    { $sort: { contagem: -1 } }
]);

// ============================================================================

// 8 - Qual marca de carro os homens preferem?
db.veiculos_certo.aggregate([
    {
        // Passo 1: Buscamos os dados do proprietário
        $lookup: {
            from: "proprietarios",
            localField: "proprietario_id",
            foreignField: "_id",
            as: "dono"
        }
    },
    { $unwind: "$dono" },
    {
        // Passo 2: Filtramos apenas onde o sexo é Masculino
        $match: { "dono.sexo": "M" } 
    },
    {
        // Passo 3: Agrupamos pela marca do carro que esse homem possui
        $group: {
            _id: "$marca",
            preferencia_count: { $sum: 1 }
        }
    },
    { $sort: { preferencia_count: -1 } },
    { $limit: 1 }
]);

// ============================================================================

// 9 - Qual cor de carro as mulheres mais preferem?
db.veiculos_certo.aggregate([
    {
        $lookup: {
            from: "proprietarios",
            localField: "proprietario_id",
            foreignField: "_id",
            as: "dono"
        }
    },
    { $unwind: "$dono" },
    {
        // Filtramos pelo sexo Feminino
        $match: { "dono.sexo": "F" }
    },
    {
        // Agrupamos pela cor do veículo
        $group: {
            _id: "$cor",
            total_cor: { $sum: 1 }
        }
    },
    { $sort: { total_cor: -1 } },
    { $limit: 1 }
]);

// ============================================================================

// 10 - Faça um ranking dos veículos mais multados, decrescente.
db.multas_registradas.aggregate([
    {
        // Agrupamos pela placa para ver qual veículo individual é o "campeão"
        $group: {
            _id: "$placa",
            total_infracoes: { $sum: 1 }
        }
    },
    // Ordenação decrescente conforme pedido no exercício 10
    { $sort: { total_infracoes: -1 } }
]);