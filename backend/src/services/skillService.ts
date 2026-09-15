import { skillRepository } from '../repositories/skillRepository.js';

export const skillService = {
  async list() {
    return skillRepository.findAll();
  },
};