import { chatbot } from '../data';
import { getExperienceYears } from './experience';

function resolveCareerStart() {
  const raw = chatbot.profile?.careerStart || '2019-05-01';
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function getProfileExperienceYears() {
  return getExperienceYears(resolveCareerStart());
}

export const BOT_NAME = chatbot.botName || 'BotFolio';
export const BOT_HANDLE = BOT_NAME.toLowerCase();
