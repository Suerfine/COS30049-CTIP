import { Router } from "express";
import { auth } from "../middelware/Auth";
import * as SearchController from "../controllers/SearchController";

const searchRouter = Router();

searchRouter.get("/park-guide", auth, SearchController.searchParkGuide);

export default searchRouter;
