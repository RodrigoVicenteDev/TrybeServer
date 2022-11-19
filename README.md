# API NG <> TRYBE 
Documentação da API da aplicação utilizada para processo seletivo, conforme especificações, esta API não esta deployada, portanto roda em localhost na porta 8080.

Esta API foi construída em um servidor NODE.js com Express, utiliza o Banco de dados PostgreSQL com TypeORM e foi escrita em TypeScript.

Documentações:

[Node](https://nodejs.org/en/docs/)

[Express](https://expressjs.com/)

[PostgreSQL](https://www.postgresql.org/docs/)

[TypeORM](https://typeorm.io/)


## EndPoints



### Rota de Sigin

|       Method         |Endpoint     |Description                                 |
|----------------|-------------------|-----------------------------|
| POST  | /sigin  | Recebe usuário com no mínimo 3 caracteres e não permite usuários iguais(unique) - Recebe password com no mínimo 8 caracteres, sendo obrigatório ao menos uma maiúscula, um número e um carácter especial e devolve uma senha hasheada e uma conta com saldo de 100

### Rota de Login

|       Method         |Endpoint     |Description                                 |
|----------------|-------------------|-----------------------------|
|POST  |/login  |Recebe usuário  - Recebe password  e devolve um Token JWT com validade de 24h


### Rota de Usurário Logado

|       Method         |Endpoint     |Description                                 |
|----------------|-------------------|-----------------------------|
|GET  |/usuario|- Acesso apenas por usuário logado - Devolve os dados do usuário logado com join da tabela Accounts, ou seja, devolve também o número da conta e o saldo. 

### Rota de Transação 

|       Method         |Endpoint     |Description                                 |
|----------------|-------------------|-----------------------------|
|PUT  |/transacao|- Acesso apenas por usuário logado - Recebe a conta para crédito e valor, a conta não pode ser a mesma de débito e checa se ha saldo disponível e se o destinatário existe, quando bem sucedida o log da transação é armazenado na tabela transactions.

### Rota de Extrato 

|       Method         |Endpoint     |Description                                 |
|----------------|-------------------|-----------------------------|
|GET  |/extrato|- Acesso apenas por usuário logado - Retorna todas as trancações que o usuário logado participa, tanto a crédito quanto a débito.

### Rota de Filtro

|       Method         |Endpoint     |Description                                 |
|----------------|-------------------|-----------------------------|
|GET  |/search/? data= & credito= & debito =|- Acesso apenas por usuário logado - Utiliza querys passadas pelo endereço para filtrar as transações do usuário logado, não sendo obrigatória a utilização de todas e podendo ser combinadas para retornarem o resultado da busca por data da realização da transação e/ou entradas e saídas


## Entitys
    
   ### Accounts:

    @PrimaryGeneratedColumn()
    id: number 
    
    @Column()
    balance: number 
    
    @OneToMany(() =>  Transactions , (transactions) =>  transactions.debitedAccountId)
    debittransactions : Transactions[]  
    
    @OneToMany(() =>  Transactions , (transactions) =>  transactions.creditedAccountId)
    credittransactions : Transactions[]

### Transactions:

    @PrimaryGeneratedColumn()
    id: number;  
    
    @ManyToOne(() =>  Accounts, (accounts) =>  accounts.debittransactions)
    creditedAccountId: Accounts;  
    
    @ManyToOne(() =>  Accounts, (accounts) =>  accounts.credittransactions)
    debitedAccountId: Accounts;  
    
    @Column()
    value: number; 
    
    @CreateDateColumn({ type:  "date" })
    createdAt: Date;


### User:

    @PrimaryGeneratedColumn()
    id: number  
    
    @Column({type:  "varchar",
    unique:  true,})
    username: string  
    
    @Column({select:  false} )
    password: string  
    
    @OneToOne(() =>  Accounts)
    @JoinColumn()
    accounts: Accounts
