import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Business } from "../../models/business.model.js";
import { Office } from "../../models/office.model.js";
import { Group } from "../../models/group.model.js";

const getOfficeHierarchy = asyncHandler(async (req, res) => {
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

    const offices = await Office.find(
      { businessId: businessId },
      {
        subordinateOffice: 1,
        officeName: 1,
        _id: 1,
        userAdded: 1,
      }
    );

    let nodes = [];
    let edges = [];

    for (const record of offices) {
      // Prepare userAdded details for the node
      const userLabels = record.userAdded.map((user) => ({
        name: user.name,
        userId: user.userId,
      }));

      let nodeItem = {
        id: record._id,
        label: {
          office: record.officeName,
          officeId: record._id,
          users: userLabels, // Including userAdded details
        },
      };

      nodes = [...nodes, nodeItem];

      // Add edges for subordinate offices
      for (let sub of record.subordinateOffice) {
        let edgeItem = { from: record._id, to: sub.subordinateOfficeId };
        edges = [...edges, edgeItem];
      }
    }

    const data = {
      nodes: nodes,
      edges: edges,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, { data }, "Hierarchy fetched successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

export const getGroupHierarchy = asyncHandler(async (req, res) => {
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

    const groups = await Group.find(
      { businessId: businessId },
      {
        subordinateGroups: 1,
        groupName: 1,
        _id: 1,
        userAdded: 1,
      }
    );

    let nodes = [];
    let edges = [];

    for (const record of groups) {
      // Prepare userAdded details for the node
      // const userLabels = record.userAdded.map((user) => ({
      //   name: user.name,
      //   userId: user.userId,
      // }));

      let nodeItem = {
        id: record._id,
        label: {
          group: record.groupName,
          groupId: record._id,
          users: record.userAdded.length, // Including userAdded details
        },
      };

      nodes = [...nodes, nodeItem];

      // Add edges for subordinate offices
      for (let sub of record.subordinateGroups) {
        let edgeItem = { from: record._id, to: sub.subordinateGroupId };
        edges = [...edges, edgeItem];
      }
    }

    const data = {
      nodes: nodes,
      edges: edges,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, { data }, "Hierarchy fetched successfully"));
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json(new ApiResponse(500, { error }, "Internal server error"));
  }
});

export { getOfficeHierarchy };
