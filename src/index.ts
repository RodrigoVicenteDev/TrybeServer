import myDataSource from "./data-source";
import * as express from "express";
import { Request, Response } from "express";
import { User } from "./entity/User";
import { Accounts } from "./entity/Accounts";
import { Transactions } from "./entity/Transactions";
import isAuth from "../src/midlewere/isAuth";
import attachCurrentUser from "./midlewere/attachCurrentUser";

const bcrypt = require("bcrypt");
const saltRounds = 10;
require("dotenv").config();
const generateToken = require("./config/jwt");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.REACT_APP_URI }));

//=================================================================================ROTAS DE API================================================================================

//+++++++++++++++++++++ SIGIN +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

app.post("/sigin", async function (req: Request, res: Response) {
  try {
    const { password, username } = req.body;
    if (
      !password ||
      !password.match(
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[$*&@#_!])[0-9a-zA-Z$*&@#_!]{8,}$/
      )
    ) {
      return res
        .status(400)
        .json({ message: "Senha não atende os requisitos de segurança" });
    }

    if (!username || !username.match(/\w{3,}/)) {
      return res
        .status(400)
        .json({ message: "Usuario não pode possuir menos de 3 caracteres " });
    }

    const salt = await bcrypt.genSalt(saltRounds);

    const passwordHash = await bcrypt.hash(password, salt);

    const user: any = await myDataSource
      .getRepository(User)
      .create({ ...req.body, password: passwordHash });

    const saveuser = await myDataSource.getRepository(User).save(user);
    console.log(saveuser);

    if (user.username) {
      console.log("entrou");
      const account = await myDataSource
        .getRepository(Accounts)
        .create({ balance: 100 });
      const accountSave = await myDataSource
        .getRepository(Accounts)
        .save(account);

      await myDataSource
        .getRepository(User)
        .update({ username: user.username }, { accounts: accountSave });

      return res.status(200).json("realizado com sucesso");
    }
  } catch (error) {
    console.log(error);
  }
});

//+++++++++++++++++++++++++++++++++++++++ LOGIN ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Por favor, informe seu email e senha." });
    }

    const user = await myDataSource
      .getRepository(User)
      .createQueryBuilder()
      .where({ username: username })
      .addSelect("User.password")
      .getOne();
    if (!user) {
      return res.status(400).json({ message: "Usuário ou senha incorretos" });
    }
    if (await bcrypt.compare(password, user.password)) {
      const token = generateToken(user);
      return res.status(200).json({
        token: token,
        user: user.username,
      });
    } else {
      return res.status(400).json({ message: "Senha ou email incorretos" });
    }
  } catch (error) {
    return res.status(400).json(error);
  }
});
//+++++++++++++++++++++++++++++++++++++++ GET CURRENT USER ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
app.get(
  "/usuario",
  isAuth,
  attachCurrentUser,
  async function (req: any, res: Response) {
    try {
      const currentusername = req.currentUser;
      const usuariologado = await myDataSource.getRepository(User).find({
        relations: {
          accounts: true,
        },
        where: {
          username: currentusername,
        },
      });

      return res.status(200).json(usuariologado);
    } catch (error) {
      console.log(error);
    }
  }
);
//+++++++++++++++++++++++++++++++++++++++ Transacao ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

app.put(
  "/transacao",
  isAuth,
  attachCurrentUser,
  async function (req: any, res: Response) {
    const { credito, valor } = req.body;

    try {
      const credor = await myDataSource.getRepository(User).find({
        relations: {
          accounts: true,
        },
        where: {
          username: credito,
        },
      });
      const verifica = credor[0].username;

      const currentuser = req.currentUser;
      const usuariologado = await myDataSource.getRepository(User).find({
        relations: {
          accounts: true,
        },
        where: {
          username: currentuser,
        },
      });

      const contacredor: number = credor[0].accounts.id;
      const saldo: number = usuariologado[0].accounts.balance;
      const debito: number = usuariologado[0].accounts.id;

      if (credito === currentuser) {
        return res
          .status(400)
          .json({ message: "Conta de crédito é a mesma para debito" });
      }
      if (valor > saldo) {
        return res.status(400).json({ message: "Saldo insuficiente" });
      }

      await myDataSource
        .createQueryBuilder()
        .update(Accounts)
        .set({ balance: () => `balance + ${valor}` })
        .where("id = :id", { id: contacredor })
        .execute();

      await myDataSource
        .createQueryBuilder()
        .update(Accounts)
        .set({ balance: () => `balance - ${valor}` })
        .where("id = :id", { id: debito })
        .execute();

      const transacao: any = new Transactions();
      transacao.creditedAccountId = contacredor;
      transacao.debitedAccountId = debito;
      transacao.value = valor;
      await myDataSource.manager.save(transacao);

      const savetransaction = await myDataSource
        .getRepository(Transactions)
        .save(transacao);
      const resposta = {
        debito: debito,
        credito: credor,
        valor: valor,
        saldo: saldo,
      };

      return res.status(200).json(savetransaction);
    } catch (error) {
      console.log(error);
      return res.json("usuario nao encontrado");
    }
  }
);
// +++++++++++++++++++++++++++++++++ Extrato ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

app.get(
  "/extrato",
  isAuth,
  attachCurrentUser,
  async function (req: any, res: Response) {
    try {
      const currentusername = req.currentUser;
      const usuariologado = await myDataSource.getRepository(User).find({
        relations: {
          accounts: true,
        },
        where: {
          username: currentusername,
        },
      });
      const conta: any = usuariologado[0].accounts.id;

      const extrato = await myDataSource
        .getRepository(Transactions)
        .createQueryBuilder("transactions")
        .leftJoinAndSelect(
          "transactions.creditedAccountId",
          "creditedAccountId"
        )
        .leftJoinAndSelect("transactions.debitedAccountId", "debitedAccountId")
        .where("transactions.creditedAccountId = :creditedAccountId", {
          creditedAccountId: conta,
        })
        .orWhere("transactions.debitedAccountId = :debitedAccountId", {
          debitedAccountId: conta,
        })
        .getMany();

      return res.json(extrato);
    } catch (error) {
      console.log(error);
    }
  }
);

// ++++++++++++++++++++++++++++++ Filter ++++++++++++++++++++++++++++++++++++++++++++++++++++++

app.get(
  "/filter",
  isAuth,
  attachCurrentUser,
  async function (req: any, res: Response) {
    try {
      const currentusername = req.currentUser;
      const usuariologado = await myDataSource.getRepository(User).find({
        relations: {
          accounts: true,
        },
        where: {
          username: currentusername,
        },
      });
      const conta: any = usuariologado[0].accounts.id;

      const extrato = await myDataSource
        .getRepository(Transactions)
        .createQueryBuilder("transactions")
        .orderBy("createdAt")
        .leftJoinAndSelect(
          "transactions.creditedAccountId",
          "creditedAccountId"
        )
        .where("transactions.creditedAccountId = :creditedAccountId", {
          creditedAccountId: conta,
        })
        .getMany();

      return res.json(extrato);
    } catch (error) {
      console.log(error);
    }
  }
);



// +++++++++++++++++++++++++++++ Filter ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
app.get(
  "/search/",
  isAuth,
  attachCurrentUser,
  async function (req: any, res: Response) {
    try {
      const newdata = new Date(req.query.data);
      const { debito, credito } = req.query;

      let dd = newdata.getDate();
      let mm = newdata.getMonth();
      let yyy = newdata.getFullYear();
      let data = `${yyy}-${mm + 1}-${dd + 1}`;
      let existdata = ""
      
      if(data != "NaN-NaN-NaN" ){
        existdata = "true"
      }
      console.log( data);
      const currentusername = req.currentUser;
      const usuariologado = await myDataSource.getRepository(User).find({
        relations: {
          accounts: true,
        },
        where: {
          username: currentusername,
        },
      });
      const conta: any = usuariologado[0].accounts.id;

      const extrato = await myDataSource
        .getRepository(Transactions)
        .createQueryBuilder("transactions")
        .leftJoinAndSelect(
          "transactions.creditedAccountId",
          "creditedAccountId"
        )
        .leftJoinAndSelect("transactions.debitedAccountId", "debitedAccountId")
        .where("transactions.creditedAccountId = :creditedAccountId", {
          creditedAccountId: conta,
        })
        .orWhere("transactions.debitedAccountId = :debitedAccountId", {
          debitedAccountId: conta,
        })

        /* .andWhere("transactions.createdAt = :createdAt", { createdAt: data })  */
        .getMany();

      let resposta = [];

// somente creditos
if ( data === "NaN-NaN-NaN" && credito === "true" && typeof debito === "undefined") {
  resposta = extrato.filter((element) => {
    let comparedate = String(element.createdAt);

    console.log(element.creditedAccountId.id === conta);
    console.log(comparedate);
    console.log("somente creditos");
    return  element.creditedAccountId.id === conta;
  });
}

// somente debitos
if ( data === "NaN-NaN-NaN" && typeof credito === "undefined" &&  debito === "true") {
  resposta = extrato.filter((element) => {
    let comparedate = String(element.createdAt);

    console.log(element.debitedAccountId.id === conta);
    console.log(comparedate);
    console.log("somente debitos");
    return  element.debitedAccountId.id === conta;
  });
}

      // Somente por data
      if (
        existdata === "true" &&
        typeof credito === "undefined" &&
        typeof debito === "undefined"
      ) {
        resposta = extrato.filter((element) => {
          let comparedate = String(element.createdAt);

          console.log(element.creditedAccountId.id === conta);
          console.log(comparedate);
          console.log("somente por data");
          return comparedate === data;
        });
      }

      // data e credito

      if (existdata === "true" && credito === "true" && typeof debito === "undefined") {
        resposta = extrato.filter((element) => {
          let comparedate = String(element.createdAt);

          console.log(element.creditedAccountId.id === conta);
          console.log(comparedate);
          console.log("data e credito");
          return comparedate === data && element.creditedAccountId.id === conta;
        });
      }

      // data e debito

      if (existdata === "true" && typeof credito === "undefined" && debito === "true") {
        resposta = extrato.filter((element) => {
          let comparedate = String(element.createdAt);

          console.log(element.creditedAccountId.id === conta);
          console.log(comparedate);
          console.log("data e debito");
          return comparedate === data && element.debitedAccountId.id === conta;
        });
      }


      return res.json(resposta);
    } catch (error) {
      console.log(error);
    }
  }
);

// +++++++++++++++++++++++++++++ GET ALL USERS ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

app.get("/teste", async function (req: Request, res: Response) {
  try {
    const resposta = await myDataSource
      .getRepository(Transactions)
      .find({ relations: { creditedAccountId: true, debitedAccountId: true } });

    /*     = await myDataSource
      .getRepository(Transactions)
      .createQueryBuilder("transactions")
      .orderBy("transactions.createdAt")
    
      .leftJoinAndSelect("transactions.creditedAccountId", "creditedAccountId")
      .getMany();
 */
    return res.json(resposta);
  } catch (error) {
    console.log(error);
  }

  /*  const users = await myDataSource.getRepository(User).find({
    relations: {
      accounts: true,
    },
  }); */
  /* const teste = await myDataSource
  .getRepository(User)
  .createQueryBuilder()
  .where( { id: 1 })
  .addSelect("User.password")
  .getOne() */
});

myDataSource
  .initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });

app.listen(process.env.PORT, () => {
  console.log(`SERVER OPEN ANS RUNNIG ON ${process.env.PORT}`);
});
