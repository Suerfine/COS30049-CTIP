import { EventResponse } from "./../types/Event";
import { NextFunction, Request, Response } from "express";
import { Event } from "../models";
import { EventStatus } from "../enum/EventStatus";

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// (GET) /api/events: return all events
export const getAllEvents = async (
  req: Request,
  res: Response<EventResponse[] | { message: string }>,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const events = await Event.findAll({
      where: { user_id: req.user.id },
      order: [["event_start_at", "ASC"]],
    });

    return res.status(200).json(events as unknown as EventResponse[]);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Internal server error",
    });
  }
};

// (POST) /api/events: create new tasks
export const createEvent = async (
  req: Request,
  res: Response<EventResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    const event = await Event.create({
      ...req.body,
      user_id: req.user.id,
      status: req.body.status || EventStatus.PENDING,
    });

    return res.status(201).json(event as unknown as EventResponse);
  } catch (err) {
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Internal server error",
    });
  }
};

// (GET) /api/events/:id: get specific task
export const getEventById = async (
  req: Request<{ id: string }>,
  res: Response<EventResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      throw new HttpError(404, "Event not found");
    }

    return res.status(200).json(event as unknown as EventResponse);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

// (PUT) /api/events/:id: edit task details
export const updateEvent = async (
  req: Request<{ id: string }>,
  res: Response<EventResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      throw new HttpError(404, "Event not found");
    }

    if (req.user && event.user_id !== req.user.id) {
      throw new HttpError(403, "Forbidden: You do not own this event");
    }

    await event.update(req.body);
    return res.status(200).json(event as unknown as EventResponse);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

// (PATCH) /api/events/:id/status: mark as done
export const updateEventStatus = async (
  req: Request<{ id: string }>,
  res: Response<EventResponse | { message: string }>,
  next: NextFunction,
) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      throw new HttpError(404, "Event not found");
    }

    const nextStatus =
      event.status === EventStatus.PENDING
        ? EventStatus.COMPLETED
        : EventStatus.PENDING;

    await event.update({ status: nextStatus });

    return res.status(200).json(event as unknown as EventResponse);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

// (DELETE) /api/events/:id
export const deleteEvent = async (
  req: Request<{ id: string }>,
  res: Response<{ message: string }>,
  next: NextFunction,
) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      throw new HttpError(404, "Event not found");
    }

    await event.destroy();
    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};
