// Criar e selecionar o banco de dados biblioteca_fatec
use('biblioteca_fatec');

// Criação explícita da coleção 'livros'
db.createCollection('livros');

// 3) Inserir documento na coleção autores (criação automática)
db.autores.insertOne({ nome: "Machado de Assis", nacionalidade: "Brasileira" });

// 4) Inserir documento na coleção alunos
db.alunos.insertOne({
  nome: "Eduardo Gabri",
  curso: "Desenvolvimento de Software Multiplataforma",
  anoIngresso: 2025,
  ativo: true
})

// 5) Inserir documento na coleção livros
db.livros.insertOne({
  titulo: "Livro Sozinho",
  anoPublicacao: 1979,
  genero: "Ficção Científica",
  paginas: 208,
  disponivel: true
});

// 6) insertMany() para três novos livros
db.livros.insertMany([
  { titulo: "Livro 1", anoPublicacao: 2008, genero: "Tecnologia", paginas: 464, disponivel: true },
  { titulo: "Livro 2", anoPublicacao: 1949, genero: "Distopia", paginas: 328, disponivel: true },
  { titulo: "Livro 3", anoPublicacao: 1899, genero: "Romance", paginas: 256, disponivel: true }
]);

// 7) Inserir na coleção autores com array de livrosPublicados
db.autores.insertOne({
  nome: "Sei não man",
  nacionalidade: "Angolano",
  livrosPublicados: ["Livro 4", "Livro 5"]
});

// 8) Livro com subdocumento 'autor'
db.livros.insertOne({
  titulo: "O Hobbit",
  autor: { nome: "J.R.R. Tolkien", nacionalidade: "Britânica" },
  disponivel: true
});

// 9) Livro com array de subdocumentos 'autores'
db.livros.insertOne({
  titulo: "Algoritmos e Estrutura de Dados",
  autores: [
    { nome: "Thomas Cormen", nacionalidade: "Americana" },
    { nome: "Charles Leiserson", nacionalidade: "Americana" }
  ],
  disponivel: true
});

// 10) Aluno com subdocumento 'contatos'
db.alunos.insertOne({
  nome: "Maria Oliveira",
  curso: "Gestão de TI",
  contatos: { email: "maria.ti@fatec.sp.gov.br", telefone: "11999998888" }
})

// 11) Livro com categorias e palavrasChave (Arrays)
db.livros.insertOne({
  titulo: "Introdução ao MongoDB",
  categorias: ["Tecnologia", "Banco de Dados"],
  palavrasChave: ["NoSQL", "JSON", "Documentos"]
});

// 12) Coleção emprestimos com subdocumentos
db.emprestimos.insertOne({
  aluno: { nome: "João Surita", curso: "Desenvolvimento de Software multiplataforma" },
  livro: { titulo: "Clean Code" },
  dataEmprestimo: new Date(),
  dataDevolucao: null,
  status: "Em Aberto"
});

// 13) insertMany() em emprestimos
db.emprestimos.insertMany([
  {
    aluno: { nome: "João Surita", curso: "Desenvolvimento de Software multiplataforma" },
    livro: { titulo: "1984" },
    dataEmprestimo: new Date(),
    status: "Finalizado"
  },
  {
    aluno: { nome: "Bruno Oller", curso: "Desenvolvimento de Software multiplataforma" },
    livro: { titulo: "Dom Casmurro" },
    dataEmprestimo: new Date(),
    status: "Em Aberto"
  },
  {
    aluno: { nome: "Shaolin Matador de Porco", curso: "Desenvolvimento de Software multiplataforma" },
    livro: { titulo: "O Hobbit" },
    dataEmprestimo: new Date(),
    status: "Atrasado"
  }
]);

// 14) Alterar disponivel para false
db.livros.updateOne({ titulo: "Livro 1" }, { $set: { disponivel: false } });

// 15) Adicionar categoria com $push
db.livros.updateOne({ titulo: "Introdução ao MongoDB" }, { $push: { categorias: "Programação" } });

// 16) Adicionar campo vezesEmprestado e incrementar com $inc
db.livros.updateOne({ titulo: "Clean Code" }, { $inc: { vezesEmprestado: 1 } });

// 17) Atualizar todos de um gênero com campo destaque
db.livros.updateMany({ genero: "Tecnologia" }, { $set: { destaque: true } });

// 18) Remover palavra específica do array com $pull
db.livros.updateOne({ titulo: "Introdução ao MongoDB" }, { $pull: { palavrasChave: "JSON" } });

// 19) Remover um único empréstimo por status
db.emprestimos.deleteOne({ status: "Finalizado" });

// 20) Remover livros com menos de 100 páginas OU gênero específico
db.livros.deleteMany({
  $or: [
    { paginas: { $lt: 100 } },
    { genero: "Romance" }
  ]
});