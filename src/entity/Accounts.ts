import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { Transactions } from "./Transactions"
@Entity()
export class Accounts {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    balance: number

    @OneToMany(() => Transactions , (transactions) => transactions.debitedAccountId)
    debittransactions : Transactions[]

    @OneToMany(() => Transactions , (transactions) => transactions.creditedAccountId)
    credittransactions : Transactions[]
}
