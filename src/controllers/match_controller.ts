/** @format */
import { Request, Response } from "express";
import matchModel from "../models/match_model";

const getAllByUserId = async (req: Request, res: Response) => {
  const userId = req.query.Id;
  try {
    if (!userId) {
      res.status(400).send("User name is required");
      return;
    }
    const matches = await matchModel.find({ userId: userId });
    res.status(200).send(matches || []);
  } catch (error) {
    res.status(500).send(error);
    return;
  }
};
const getById = async (req: Request, res: Response) => {
  const matchId = req.params.id;
  try {
    if (!matchId) {
      res.status(400).send("Match ID is required");
      return;
    }

    const match = await matchModel.findById(matchId);
    if (!match) {
      res.status(404).send("Match not found");
      return;
    }
    res.status(200).send(match);
  } catch (error) {
    res.status(500).send(error);
    return;
  }
};

const deleteById = async (req: Request, res: Response) => {
  const matchId = req.params.id;
  try {
    if (!matchId) {
      res.status(400).send("Match ID is required");
      return;
    }

    const match = await matchModel.findByIdAndDelete(matchId);
    if (!match) {
      res.status(404).send("Match not found");
      return;
    }
    res.status(200).send("Match deleted successfully");
  } catch (error) {
    res.status(500).send(error);
    return;
  }
};

export default {
  getAllByUserId,
  deleteById,
  getById,
};
