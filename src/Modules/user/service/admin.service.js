import { findAll } from "../../../DB/DB.service.js";
import { userModel } from "../../../DB/models/user.model.js";
import { asynchandler } from "../../../Utils/errors/errorhandeler.js";
import { paginate } from "../../../Utils/pages/pagination.js";
import { sucessResponse } from "../../../Utils/res/sucessResponse.js";

export const getAllUsers = asynchandler(async (req, res, next) => {
  const { search, role, provider } = req.query;
  const { page, limit, skip } = paginate(req.query);

  const filter = {};
  if (role) filter.role = role;
  if (provider) filter.provider = provider;

  if (search) {
    filter.$or = [
      { userName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const users = await findAll({
    model: userModel,
    filter,
    limit,
    skip,
    select: "-password -__v -forgetPasswordOtp -confirmEmailOtp",
  });

  const total = await userModel.countDocuments(filter);

  return sucessResponse({
    res,
    data: {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export const getUserById = asynchandler(async (req, res, next) => {
    const { userId } = req.params;
  
    const user = await userModel.findById(userId).select("-password -__v -forgetPasswordOtp -confirmEmailOtp");
  
    if (!user) {
      return next(new Error("User not found", { cause: 404 }));
    }
  
    return sucessResponse({
      res,
      data: user,
    });
  });
