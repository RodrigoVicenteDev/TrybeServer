import { Entity, PrimaryGeneratedColumn, Column , OneToOne,
    JoinColumn } from "typeorm"
import { Accounts } from "./Accounts"


@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number

    @Column({type: "varchar",
    unique: true,})
    username: string

    @Column({select: false} )
    password: string

    
    
    @OneToOne(() => Accounts)
    @JoinColumn()
    accounts: Accounts
 
}
