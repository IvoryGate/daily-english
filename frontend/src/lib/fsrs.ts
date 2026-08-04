import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Card,
  type Rating,
} from 'ts-fsrs'
import type { FSRSCardData } from '@/types'

const scheduler = fsrs(generatorParameters())

function toData(card: Card): FSRSCardData {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review ? card.last_review.toISOString() : null,
  }
}

function toCard(data: FSRSCardData): Card {
  return {
    due: new Date(data.due),
    stability: data.stability,
    difficulty: data.difficulty,
    elapsed_days: data.elapsed_days,
    scheduled_days: data.scheduled_days,
    learning_steps: data.learning_steps,
    reps: data.reps,
    lapses: data.lapses,
    state: data.state,
    last_review: data.last_review ? new Date(data.last_review) : undefined,
  }
}

export function newCard(): FSRSCardData {
  return toData(createEmptyCard())
}

export function review(card: FSRSCardData, rating: Rating): FSRSCardData {
  const scheduling = scheduler.repeat(toCard(card), new Date())
  const item = (
    scheduling as unknown as Record<number, { card: Card }>
  )[rating]
  return toData(item.card)
}

export function isDue(card: FSRSCardData): boolean {
  return new Date(card.due).getTime() <= Date.now()
}

export function daysUntilDue(card: FSRSCardData): number {
  return Math.ceil((new Date(card.due).getTime() - Date.now()) / 86400000)
}
