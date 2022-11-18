import { timeStamp } from "console";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Timestamp,
} from "typeorm";
import { Accounts } from "./Accounts";

@Entity()
export class Transactions {
  @PrimaryGeneratedColumn()
  id: number;

  
  
  @ManyToOne(() => Accounts, (accounts) => accounts.debittransactions)
  creditedAccountId: Accounts;

  @ManyToOne(() => Accounts, (accounts) => accounts.credittransactions)
  debitedAccountId: Accounts;


  @Column()
  value: number;

  @CreateDateColumn({type: "date"})
  createdAt: Date;
}
