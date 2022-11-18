import { Console } from "console";
import myDataSource from "../data-source";
import { User } from "../entity/User";

async function attachCurrentUser(req: any, res: any, next: any) {
  try {
    const loggedInUser = req.auth;

    const logado = await myDataSource
      .getRepository(User)
      .findOneBy({ username: loggedInUser.username });
   
    req.currentUser = logado.username;

    next();
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
}
export default attachCurrentUser;
