import { answerModel } from "../../../DB/models/answer.model.js";
import { questionModel } from "../../../DB/models/questions.model.js";
import { quizModel } from "../../../DB/models/quiz.model.js";
import { submissionModel } from "../../../DB/models/submission.model.js";
import { asynchandler } from "../../../Utils/errors/errorhandeler.js";
import { sucessResponse } from "../../../Utils/res/sucessResponse.js";


// export const submitSubmission = asynchandler(async (req, res, next) => {
//   const startTime = Date.now();
//   const { quizId, answers } = req.body;
//   const userId = req.user._id;

//   if (!quizId || !Array.isArray(answers) || answers.length === 0) {
//     return next(new Error('quizId and answers array are required', { cause: 400 }));
//   }

//   // Validate quiz exists
//   const quiz = await quizModel.findById(quizId).lean();
//   if (!quiz) {
//     return next(new Error('Quiz not found', { cause: 404 }));
//   }

//   // Fetch questions for the quiz
//   const questions = await questionModel
//     .find({ quiz: quizId })
//     .lean()
//     .select('options correctAnswer');

//   if (questions.length === 0) {
//     return next(new Error('No questions found for this quiz', { cause: 404 }));
//   }


//   const questionIds = questions.map(q => q._id.toString());
//   const processedAnswers = [];
//   const answerRecords = [];
//   const errors = [];

//   for (const answer of answers) {
//     const { questionId, selectedOption } = answer;
//     if (!questionId || !selectedOption) {
//       errors.push(`Missing questionId or selectedOption`);
//       continue;
//     }

//     if (!questionIds.includes(questionId)) {
//       errors.push(`Invalid questionId: ${questionId}`);
//       continue;
//     }

//     if (!['A', 'B', 'C', 'D'].includes(selectedOption)) {
//       errors.push(`Invalid selectedOption: ${selectedOption} for question ${questionId}`);
//       continue;
//     }

//     const question = questions.find(q => q._id.toString() === questionId);
//     if (!question.options[selectedOption]) {
//       errors.push(`Invalid option ${selectedOption} for question ${questionId}`);
//       continue;
//     }

//     const expectedAnswer = `${selectedOption}:${question.options[selectedOption]}`;
//     const isCorrect = question.correctAnswer === expectedAnswer;

//     // Debug log
//     console.log(`Answer Debug: questionId=${questionId}, selectedOption=${selectedOption}, expectedAnswer=${expectedAnswer}, correctAnswer=${question.correctAnswer}, isCorrect=${isCorrect}`);

//     processedAnswers.push({
//       questionId,
//       selectedOption,
//       isCorrect,
//     });

//     // Store in answerModel for analytics
//     answerRecords.push({
//       user: userId,
//       quiz: quizId,
//       question: questionId,
//       selectedOption,
//       isCorrect,
//     });
//   }

//   if (processedAnswers.length === 0) {
//     return next(new Error(`No valid answers provided: ${errors.join('; ')}`, { cause: 400 }));
//   }

//   // Calculate score
//   const score = processedAnswers.filter(a => a.isCorrect).length;
//   console.log(`Calculated Score: ${score}/${processedAnswers.length}`);

//   // Save submission
//   const saveStart = Date.now();
//   const submission = await submissionModel.create({
//     userId,
//     quizId,
//     answers: processedAnswers,
//     score,
//   });

//   // Save to answerModel (optional)
//   if (answerRecords.length > 0) {
//     await answerModel.insertMany(answerRecords, { ordered: false });
//   }
//   const saveEnd = Date.now();
//   console.log(`Database Save Duration: ${saveEnd - saveStart}ms`);

//   console.log(`Total Duration: ${saveEnd - startTime}ms`);

//   return sucessResponse({
//     res,
//     message: 'Submission saved successfully',
//     data: {
//       submissionId: submission._id,
//       quizId,
//       score,
//       submittedAnswers: processedAnswers.length,
//       errors: errors.length > 0 ? errors : undefined,
//     },
//   });
// });


// export const submitSubmission = asynchandler(async (req, res, next) => {
//   const { quizId, answers } = req.body;
//   const userId = req.user._id;

//   // Validate input
//   if (!quizId || !Array.isArray(answers) || answers.length === 0) {
//     return next(new Error('quizId and non-empty answers array are required', { cause: 400 }));
//   }

//   // Check if quiz exists
//   const quiz = await quizModel.findById(quizId);
//   if (!quiz) {
//     return next(new Error('Quiz not found', { cause: 404 }));
//   }

//   // Fetch questions for the quiz
//   const questions = await questionModel
//     .find({ quiz: quizId })
//     .select('options correctAnswer');
  
//   if (questions.length === 0) {
//     return next(new Error('No questions found for this quiz', { cause: 404 }));
//   }

//   const processedAnswers = [];
//   const questionIds = questions.map(q => q._id.toString());

//   // Process answers
//   for (const answer of answers) {
//     const { questionId, selectedOption } = answer;

//     // Validate answer fields
//     if (!questionId || !selectedOption) {
//       return next(new Error('Each answer must have questionId and selectedOption', { cause: 400 }));
//     }

//     // Validate questionId
//     if (!questionIds.includes(questionId)) {
//       return next(new Error(`Invalid questionId: ${questionId}`, { cause: 400 }));
//     }

//     // Validate selectedOption
//     if (!['A', 'B', 'C', 'D'].includes(selectedOption)) {
//       return next(new Error(`Invalid selectedOption: ${selectedOption}`, { cause: 400 }));
//     }

//     const question = questions.find(q => q._id.toString() === questionId);
//     if (!question.options[selectedOption]) {
//       return next(new Error(`Option ${selectedOption} not found for question ${questionId}`, { cause: 400 }));
//     }

//     // Check if answer is correct
//     const isCorrect = question.correctAnswer === `${selectedOption}:${question.options[selectedOption]}`;

//     processedAnswers.push({
//       questionId,
//       selectedOption,
//       isCorrect,
//     });
//   }

//   // Calculate score
//   const score = processedAnswers.filter(a => a.isCorrect).length;

//   // Save submission
//   const submission = await submissionModel.create({
//     userId,
//     quizId,
//     answers: processedAnswers,
//     score,
//   });

//   return sucessResponse({
//     res,
//     message: 'Submission saved successfully',
//     data: {
//       submissionId: submission._id,
//       quizId,
//       score,
//       totalQuestions: processedAnswers.length,
//     },
//     status: 201,
//   });
// });


export const submitSubmission = asynchandler(async (req, res, next) => {
  const { quizId, answers } = req.body;
  const userId = req.user._id;

  // Validate input
  if (!quizId || !Array.isArray(answers) || answers.length === 0) {
    return next(new Error('quizId and non-empty answers array are required', { cause: 400 }));
  }

  // Check if quiz exists
  const quiz = await quizModel.findById(quizId);
  if (!quiz) {
    return next(new Error('Quiz not found', { cause: 404 }));
  }

  // Fetch questions for the quiz
  const questions = await questionModel
    .find({ quiz: quizId })
    .select('options correctAnswer');
  
  if (questions.length === 0) {
    return next(new Error('No questions found for this quiz', { cause: 404 }));
  }

  // Delete existing submission for this user and quiz, if any
  await submissionModel.deleteMany({ userId, quizId });

  const processedAnswers = [];
  const questionIds = questions.map(q => q._id.toString());

  // Process answers
  for (const answer of answers) {
    const { questionId, selectedOption } = answer;

    // Validate answer fields
    if (!questionId || !selectedOption) {
      return next(new Error('Each answer must have questionId and selectedOption', { cause: 400 }));
    }

    // Validate questionId
    if (!questionIds.includes(questionId)) {
      return next(new Error(`Invalid questionId`, { cause: 400 }));
    }

    // Validate selectedOption
    if (!['A', 'B', 'C', 'D'].includes(selectedOption)) {
      return next(new Error(`Invalid selectedOption: ${selectedOption}`, { cause: 400 }));
    }

    const question = questions.find(q => q._id.toString() === questionId);
    if (!question.options[selectedOption]) {
      return next(new Error(`Option ${selectedOption} not found for question ${questionId}`, { cause: 400 }));
    }

    // Check if answer is correct
    const isCorrect = question.correctAnswer === `${selectedOption}:${question.options[selectedOption]}`;

    processedAnswers.push({
      questionId,
      selectedOption,
      isCorrect,
    });
  }

  // Calculate score
  const score = processedAnswers.filter(a => a.isCorrect).length;

  // Save new submission
  const submission = await submissionModel.create({
    userId,
    quizId,
    answers: processedAnswers,
    score,
  });

  return sucessResponse({
    res,
    message: 'Submission saved successfully',
    data: {
      submissionId: submission._id,
      quizId,
      score: score,
      totalQuestions: processedAnswers.length,
    },
    status: 201,
  });
});


export const getAnswers = asynchandler(async (req, res, next) => {
  const { quizId } = req.params;
  const userId = req.user._id;

  if (!quizId) {
    return next(new Error('quizId is required', { cause: 400 }));
  }

  // Fetch answers with question details
  const dbStart = Date.now();
  const answers = await answerModel
    .find({ user: userId, quiz: quizId })
    .populate({
      path: 'question',
      select: 'text options correctAnswer',
    })
    .lean();


  if (!answers.length) {
    return next(new Error('No answers found for this quiz', { cause: 404 }));
  }

  // Format response
  const formattedAnswers = answers.map(answer => ({
    questionId: answer.question._id,
    questionText: answer.question.text,
    options: answer.question.options,
    selectedOption: answer.selectedOption,
    correctAnswer: answer.question.correctAnswer,
    isCorrect: answer.isCorrect,
  }));


  return sucessResponse({
    res,
    message: 'Answers retrieved successfully',
    data: {
      quizId,
      answers: formattedAnswers,
    },
  });
});