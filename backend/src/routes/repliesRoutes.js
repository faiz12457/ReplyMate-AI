import { Router } from 'express';

import { generateContextAwareReplies } from '../services/aiReplyService.js';
import { validateGenerateRepliesRequest } from '../validators/replyRequestValidator.js';

export function createRepliesRouter({ replyGenerator = generateContextAwareReplies } = {}) {
  const router = Router();

  router.post('/generate', async (req, res, next) => {
    try {
      const validation = validateGenerateRepliesRequest(req.body);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
          code: 'VALIDATION_ERROR',
        });
      }

      const replies = await replyGenerator(validation.value);

      return res.status(200).json({
        success: true,
        replies,
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
