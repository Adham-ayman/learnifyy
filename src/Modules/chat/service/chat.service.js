import { chatModel } from "../../../DB/models/chat.model.js";
import { courseModel } from "../../../DB/models/course.model.js";
import { progressTrackingModel } from "../../../DB/models/progressTracking.model.js";
import { questionModel } from "../../../DB/models/questions.model.js";
import { quizModel } from "../../../DB/models/quiz.model.js";
import { userModel } from "../../../DB/models/user.model.js";
import { asynchandler } from "../../../Utils/errors/errorhandeler.js";
import { sucessResponse } from "../../../Utils/res/sucessResponse.js";
import { callAI, callDeepSeek } from "./gemini.service.js";




// export const generateStudyPlan = asynchandler(async (req, res, next) => {
//     const userId = req.user._id;
//     const { subjects = [], goals = '', schedule = '' } = req.body;
  
//     const courses = await courseModel.find({ title: { $in: subjects } }).lean();
  
//     if (courses.length === 0) {
//       return next(new Error("No matching courses found", { cause: 404 }));
//     }
  
//     const courseTitles = courses.map(c => c.title).join(", ");
//     const prompt = `
//     You are a study planner AI. Based on the user's input, generate a detailed, structured, and motivational study plan. 
//     The plan should be tailored to web development and follow this structure:
    
//     ## Week 1: [Week summary]
//     ### Monday
//     - Subject: What to study
//     ### Tuesday
//     - Subject: What to study
//     ...
    
//     The subjects are: ${courseTitles || 'Not specified'}
//     The user's goals are: ${goals || 'Not specified'}
//     The user's schedule is: ${schedule || 'Not specified'}
//     Be sure to include motivational language and encouragement to stay on track.
//     `;
    
    
  
//     const aiResponse = await callDeepSeek(prompt);
//     console.log("AI Response:", aiResponse);
//     const structuredPlan  = formatStudyPlan(aiResponse);
  
//     const studyPlanObject = {
//       studyPlanText: structuredPlan,  
//       createdAt: new Date(),
//     };
  
//     await userModel.findByIdAndUpdate(userId, {
//         $push: { studyPlans: studyPlanObject },  
//     });
  
//     return sucessResponse({
//       res,
//       message: "AI-generated study plan saved",
//       data: studyPlanObject,
//     });
// });


export const generateStudyPlan = asynchandler(async (req, res, next) => {
  const userId = req.user._id;
  const { subjects = [], goals = '', schedule = '' } = req.body;

  const courses = await courseModel.find({ title: { $in: subjects } }).lean();

  if (courses.length === 0) {
    return next(new Error("No matching courses found", { cause: 404 }));
  }

  const courseTitles = courses.map(c => c.title).join(", ");
  const prompt = `
  You are a study planner AI. Based on the user's input, generate a detailed, structured, and motivational study plan for **4 weeks**. 
  The plan should be tailored to web development and follow this structure for each week:
  
  ## Week X: [Week summary]
  ### Monday
  - Subject: What to study
  ### Tuesday
  - Subject: What to study
  ### Wednesday
  - Subject: What to study
  ### Thursday
  - Subject: What to study
  ### Friday
  - Subject: What to study
  ### Saturday
  - Subject: What to study
  ### Sunday
  - Subject: What to study
  
  The subjects are: ${courseTitles || 'Not specified'}
  The user's goals are: ${goals || 'Not specified'}
  The user's schedule is: ${schedule || 'Not specified'}
  Be sure to include motivational language and encouragement to stay on track for each week.
  Generate a plan for 4 weeks, ensuring each week builds on the previous one and covers progressive topics in web development.
  Provide a separate task for each day (Monday through Sunday) in each week, even if the tasks are similar. Do not combine days (e.g., avoid "Tuesday - Friday").
  `;

  const aiResponse = await callAI(prompt);
  const structuredPlan = formatStudyPlan(aiResponse);

  const studyPlanObject = {
    subjects,
    goals,
    schedule,
    plan: structuredPlan,
    createdAt: new Date(),
  };

  await userModel.findByIdAndUpdate(userId, {
    $push: { studyPlans: studyPlanObject },
  });

  return sucessResponse({
    res,
    message: "AI-generated study plan saved",
    data: studyPlanObject,
  });
});
export const formatStudyPlan = (aiResponse) => {
  try {
    // Handle JSON or string input
    let input;
    try {
      input = typeof aiResponse === 'string' ? JSON.parse(aiResponse) : aiResponse;
    } catch (e) {
      input = aiResponse; // Treat as raw Markdown string if not JSON
    }

    // If input is already a structured array matching the schema, return it
    if (
      Array.isArray(input) &&
      input.every(
        (week) =>
          typeof week.weekTitle === 'string' &&
          Array.isArray(week.days) &&
          week.days.every(
            (day) => typeof day.day === 'string' && Array.isArray(day.tasks)
          )
      )
    ) {
      return input;
    }

    // If input is a Markdown string, parse it into structured format
    if (typeof input === 'string') {
      const weeks = [];
      // Normalize newlines
      const normalizedInput = input.replace(/\r\n/g, '\n').trim();

      // Split into weeks using ## as delimiter
      const weekSections = normalizedInput.split('\n## ').filter(section => section.trim());
      for (let section of weekSections) {
        if (!section.startsWith('Week')) {
          section = 'Week ' + section; // Re-add Week for first section
        }

        // Match week title (Week X: ...)
        const weekMatch = section.match(/Week \d+:.*?(?=\n|$)/);
        if (!weekMatch) continue;
        const weekTitle = weekMatch[0].trim();
        const weekContent = section.slice(weekMatch[0].length).trim();

        const days = [];
        // Match each day (### DayName ... or ### DayRange ...)
        const dayRegex = /###\s*([A-Za-z]+(?:\s*-\s*[A-Za-z]+)?)\s*\n([\s\S]*?)(?=\n###|\n##|$)/g;
        let dayMatch;

        while ((dayMatch = dayRegex.exec(weekContent))) {
          const dayOrRange = dayMatch[1].trim();
          const dayContent = dayMatch[2].trim();
          const tasks = [];

          // Match tasks (- ...)
          const taskRegex = /-\s*([^\n]*)/g;
          let taskMatch;

          while ((taskMatch = taskRegex.exec(dayContent))) {
            const task = taskMatch[1].trim();
            if (task) tasks.push(task);
          }

          // Handle single day or day range
          if (dayOrRange.includes('-')) {
            // Day range like "Tuesday - Friday"
            const [startDay, endDay] = dayOrRange.split(/\s*-\s*/).map(d => d.trim());
            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const startIndex = dayNames.indexOf(startDay);
            const endIndex = dayNames.indexOf(endDay);

            if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
              for (let i = startIndex; i <= endIndex; i++) {
                if (tasks.length > 0) {
                  days.push({ day: dayNames[i], tasks: [...tasks] });
                }
              }
            }
          } else {
            // Single day
            if (tasks.length > 0) {
              days.push({ day: dayOrRange, tasks });
            }
          }
        }

        if (days.length > 0) {
          weeks.push({ weekTitle, days });
        }
      }

      // If parsing produced valid weeks, return them
      if (weeks.length > 0) {
        return weeks;
      }

      // Fallback: treat the entire input as a single task
      return [
        {
          weekTitle: 'Week 1: Unstructured Plan',
          days: [
            {
              day: 'Unknown',
              tasks: [normalizedInput],
            },
          ],
        },
      ];
    }

    // Fallback for unexpected input
    return [
      {
        weekTitle: 'Week 1: Error',
        days: [
          {
            day: 'Unknown',
            tasks: [JSON.stringify(input)],
          },
        ],
      },
    ];
  } catch (error) {
    console.error('Error formatting study plan:', error.message);
    return [
      {
        weekTitle: 'Week 1: Error',
        days: [
          {
            day: 'Unknown',
            tasks: ['Error generating study plan'],
          },
        ],
      },
    ];
  }
};


// export const getCourseByIdChat = asynchandler(async (req, res, next) => {
//     const { courseId } = req.params;
  
//     const course = await courseModel.findById(courseId)
//       .select("-__v")
//       .populate([
//         { path: "instructorId", select: "userName email" },
//         {
//           path: "sectionsId",
//           populate: {
//             path: "lectures",
//             select: "isFreePreview",
//           },
//         },
//         { path: "enrolledUsers", select: "userName email" },
//       ])
//       .lean();
  
//     if (!course) {
//       return next(new Error("Course not found", { cause: 404 }));
//     }
  
//     const ratingData = await getCourseRatingData(courseId);
  
//     return sucessResponse({
//       res,
//       data: {
//         ...course,
//         averageRating: ratingData.averageRating,
//         totalFeedbacks: ratingData.totalFeedbacks,
//       },
//     });
//   });  
  
  
export const getProgressChat = asynchandler(async (req, res, next) => {
    const { courseId } = req.params;
    const userId = req.user._id;
  
    const progress = await progressTrackingModel
      .findOne({ userId, courseId })
      .populate({
        path: "completedLecturesId",
        select: "title",
      })
      .lean();
  
    if (!progress) {
      return next(
        new Error("Progress not found for this course", { cause: 404 })
      );
    }
  
    return sucessResponse({
      res,
      data: progress,
    });
  });

  export const studyPlan = async (req, res) => {
    try {
      const userId = req.user._id;
      if (!userId) {
        return res.status(404).json({ message: 'No user ID found' });
      }
  
      const user = await userModel.findById(userId).select('studyPlans');
  
      if (!user || !user.studyPlans || user.studyPlans.length === 0) {
        return res.status(404).json({ message: 'No study plan found' });
      }
  
  
      res.status(200).json({ studyPlan: user.studyPlans });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  };



//////////////////QUIZ/////////////////////
export const generateQuiz = asynchandler(async (req, res, next) => {
  const { category, subCategory, level, numQuestions } = req.body;

  if (!category || !subCategory || !level || !numQuestions) {
    return next(new Error("Category, subCategory, level, and numQuestions are required", { cause: 400 }));
  }

  if (numQuestions < 10 || numQuestions > 30) {
    return next(new Error("Number of questions must be between 10 and 30", { cause: 400 }));
  }

  const topic = `${category} - ${subCategory}`;

  const prompt = `
You are an expert tutor. Generate a multiple-choice quiz with exactly ${numQuestions} questions on "${topic}" at "${level}" level.
Each question must have:
- A concise question (max 20 words)
- Four short options (A, B, C, D, max 10 words each)
- The correct option letter (A, B, C, or D)

Format:
Q: [question]
A. [option1]
B. [option2]
C. [option3]
D. [option4]
Answer: [A/B/C/D]

Separate questions with a blank line. Use minimal text for clarity.
  `;

  const aiResponse = await callAI(prompt);

  const parsedQuiz = parseAIQuiz(aiResponse);

  if (parsedQuiz.length === 0) {
    return next(new Error("Failed to parse any questions from AI response", { cause: 500 }));
  }

  if (parsedQuiz.length < numQuestions * 0.8) {
    console.warn(`Parsed only ${parsedQuiz.length} questions out of ${numQuestions} requested`);
  }

  const newQuiz = await quizModel.create({
    title: `Quiz on ${subCategory}`,
    category,
    subCategory,
    level,
  });

  const questionDocs = await questionModel.insertMany(
    parsedQuiz.map(q => ({
      quiz: newQuiz._id,
      text: q.question,
      options: q.options, // Now an object { A, B, C, D }
      correctAnswer: q.correctAnswer, // Now "Letter:Text"
    })),
    { ordered: false }
  );

  newQuiz.questionsId = questionDocs.map(q => q._id);
  await newQuiz.save();


  return sucessResponse({
    res,
    message: "AI-generated quiz saved",
    data: {
      quiz: newQuiz,
      questions: questionDocs,
    },
  });
});

const parseAIQuiz = (text) => {
  try {
    // Normalize input
    const normalizedText = text.replace(/\r\n/g, '\n').trim();
    const questions = [];

    // Match question blocks
    const questionRegex = /Q:\s*([^\n]+)\n([\s\S]*?)(?=\n\s*\nQ:|$)/g;
    let questionMatch;

    while ((questionMatch = questionRegex.exec(normalizedText))) {
      const questionText = questionMatch[1].trim();
      const blockContent = questionMatch[2].trim();
      const options = { A: '', B: '', C: '', D: '' };

      // Match options
      const optionRegex = /^([A-D])[\.\)\-\s]\s*([^\n]+)/gm;
      let optionMatch;

      while ((optionMatch = optionRegex.exec(blockContent))) {
        const optionLetter = optionMatch[1].toUpperCase();
        const optionText = optionMatch[2].trim();
        if (['A', 'B', 'C', 'D'].includes(optionLetter)) {
          options[optionLetter] = optionText;
        }
      }

      // Match answer
      const answerRegex = /Answer:\s*([A-D])/i;
      const answerMatch = blockContent.match(answerRegex);
      const correctOptionLetter = answerMatch ? answerMatch[1].toUpperCase() : null;

      // Validate question
      if (
        questionText &&
        options.A &&
        options.B &&
        options.C &&
        options.D &&
        correctOptionLetter &&
        ['A', 'B', 'C', 'D'].includes(correctOptionLetter)
      ) {
        const correctAnswer = `${correctOptionLetter}:${options[correctOptionLetter]}`;
        questions.push({
          question: questionText,
          options,
          correctAnswer,
        });
      }
    }

    return questions;
  } catch (error) {
    console.error('Error parsing AI quiz:', error.message);
    return [];
  }
};
  
  export const getAllQuizzes = asynchandler(async (req, res) => {
    const { category, subCategory, level } = req.query;
  
    const filter = {};
    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (level) filter.level = level;
  
    const quizzes = await quizModel.find(filter).sort({ createdAt: -1 }).lean();
    sucessResponse({ res, message: "Fetched quizzes", data: quizzes });
  });
  
  export const getQuizById = asynchandler(async (req, res, next) => {
    const { id } = req.params;
  
    const quiz = await quizModel.findById(id).lean();
    if (!quiz) return next(new Error("Quiz not found", { cause: 404 }));
  
    const questions = await questionModel.find({ quiz: id }).lean();
  
    sucessResponse({ res, message: "Quiz details", data: { quiz, questions } });
  });


  export const deepcheck = async (req, res) => {
    try {
      const response = await callDeepSeek(req.body.prompt);
      res.send({ response });
    } catch (err) {
      res.status(500).send({ error: 'Failed to get response from DeepSeek.' });
    }
  }



/////////////chatbot//////////////


// Send a message to the chatbot and get a response
export const sendMessage = asynchandler(async (req, res, next) => {
  const { message } = req.body;
  const userId = req.user._id;
  const userName = req.user.userName;

  if (!message) {
    return next(new Error("Message is required", { cause: 400 }));
  }

  const user = await userModel.findById(userId);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  // Normalize message for greeting detection
  const normalizedMessage = message.toLowerCase().trim();
  const isGreeting = ["hi", "hello", "hey", "greetings"].some((greeting) =>
    normalizedMessage.includes(greeting)
  );

  // Build conversation context
  let chat = await chatModel.findOne({ user: userId, isActive: true });
  const conversationHistory = chat
    ? chat.messages.map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n")
    : "";

  const prompt = `
You are an AI assistant on the Learnify website, designed to help users with study-related questions. Your responses must be focused on educational topics (e.g., web development, programming, math, science). If the user asks about non-study topics, politely redirect them to study-related questions with a message like: "I'm here to help with your studies! Please ask about a study topic, like web development or math."

If the user's message contains greetings like "hi", "hello", "hey", or "greetings", respond with: "Hello ${userName}, I'm your AI assistant on the Learnify website. How can I help you with your studies today?" and do not process the message further unless it contains study-related content.

Otherwise, respond to the user's study-related question in a clear, motivational, and educational manner. Use the conversation history to maintain context, but ensure responses are concise and relevant.

Conversation history:
${conversationHistory}

User's current message: ${message}

Format your response as plain text, without Markdown or extra formatting.
`;

  try {
    const aiResponse = await callAI(prompt);

    // Create or update chat
    if (!chat) {
      chat = await chatModel.create({
        user: userId,
        messages: [
          { role: "user", content: message },
          { role: "assistant", content: aiResponse },
        ],
      });
    } else {
      chat.messages.push({ role: "user", content: message });
      chat.messages.push({ role: "assistant", content: aiResponse });
      await chat.save();
    }

    return sucessResponse({
      res,
      message: "Chatbot response generated successfully",
      data: {
        userMessage: message,
        assistantResponse: aiResponse,
        chatId: chat._id,
      },
      status: 200,
    });
  } catch (error) {
    return next(new Error(`Failed to generate response: ${error.message}`, { cause: 500 }));
  }
});

// Get chat history for the authenticated user
export const getChatHistory = asynchandler(async (req, res, next) => {
  const userId = req.user._id;

  const user = await userModel.findById(userId);
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  const chat = await chatModel
    .findOne({ user: userId, isActive: true })
    .populate("user", "userName email");

  return sucessResponse({
    res,
    message: "Chat history retrieved successfully",
    data: chat || { user: userId, messages: [] },
    status: 200,
  });
});