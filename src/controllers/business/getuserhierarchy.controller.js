import { Business } from "../../models/business.model.js";
import { Businessusers } from "../../models/businessUsers.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import catchAsync from "../../utils/catchAsync.js";

const getUserHierarchyData = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Token is Invalid!!"));
    }
    const businessId = req.params.businessId;
    if (!businessId) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business ID is not provided"));
    }
    const business = await Business.findById(businessId);
    if (!business) {
      return res
        .status(400)
        .json(new ApiResponse(400, {}, "Business not found"));
    }
    const users = await Businessusers.find(
      { businessId: businessId, userType: "Insider" },
      { userId: 1, subordinates: 1, name: 1, role: 1 }
    );
    // console.log(users);
    let nodes = [];
    let edges = [];

    for (const record of users) {
      let nodeItem = {
        id: record.userId.toString(),
        label: {
          name: record.name,
          userId: record.userId.toString(),
          role: record.role,
        },
      };
      nodes = [...nodes, nodeItem];

      let subordinates = record.subordinates;
      for (let sub of subordinates) {
        let edgeItem = { from: record.userId.toString(), to: sub.toString() };
        edges = [...edges, edgeItem];
      }
    }

    // console.log(nodes);
    // console.log(edges);

    const data = {
      nodes: nodes,
      edges: edges,
    };
    return res
      .status(200)
      .json(new ApiResponse(200, { data }, "Hierarchy fetched successfully"));
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

export { getUserHierarchyData };