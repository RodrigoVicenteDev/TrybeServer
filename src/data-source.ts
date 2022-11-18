import "reflect-metadata"
import { DataSource } from "typeorm"
import { Accounts } from "./entity/Accounts";
import { Transactions } from "./entity/Transactions";
import { User}  from "./entity/User"
require("dotenv").config();

const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5433,
    username: "postgres",
    password: `${process.env.DB_PASSWORD}`,
    database: "TribeDb",
    synchronize: true,
    logging: false,
    entities: [User , Accounts, Transactions],
    migrations: [],
    subscribers: [],
})
export default AppDataSource