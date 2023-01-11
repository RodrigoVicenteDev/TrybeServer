import "reflect-metadata"
import { DataSource } from "typeorm"
import { Accounts } from "./entity/Accounts";
import { Transactions } from "./entity/Transactions";
import { User}  from "./entity/User"
require("dotenv").config();

const AppDataSource = new DataSource({
    type: "postgres",
    host: "postgres",
    port: 5432,
    username: "postgres",
    password: `${process.env.POSTGRES_PASSWORD}`,
    database: "postgres",
    synchronize: true,
    logging: false,
    entities: [User , Accounts, Transactions],
    migrations: [],
    subscribers: [],
})
export default AppDataSource