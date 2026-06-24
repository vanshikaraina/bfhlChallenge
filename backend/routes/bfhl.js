const express = require("express");
const router = express.Router();

function validateEntries(entries) {
    const validEdges = [];
    const invalidEntries = [];
    const edgePattern = /^[A-Z]->[A-Z]$/;

    for (const rawEntry of entries) {
        if (!rawEntry || typeof rawEntry !== "string") {
            invalidEntries.push(rawEntry);
            continue;
        }

        const cleanedEntry = rawEntry.trim();

        if (!edgePattern.test(cleanedEntry)) {
            invalidEntries.push(rawEntry);
            continue;
        }

        const [parentNode, childNode] = cleanedEntry.split("->");

        if (parentNode === childNode) {
            invalidEntries.push(rawEntry);
            continue;
        }

        validEdges.push(cleanedEntry);
    }

    return { validEdges, invalidEntries };
}

function removeDuplicateEdges(edges) {
    const uniqueEdges = [];
    const duplicateEdges = [];
    const seenEdges = new Set();
    const reportedDuplicates = new Set();

    for (const edge of edges) {
        if (!seenEdges.has(edge)) {
            seenEdges.add(edge);
            uniqueEdges.push(edge);
        } else {
            if (!reportedDuplicates.has(edge)) {
                duplicateEdges.push(edge);
                reportedDuplicates.add(edge);
            }
        }
    }

    return { uniqueEdges, duplicateEdges };
}

function keepFirstParent(edges) {
    const filteredEdges = [];
    const assignedChildren = new Set();

    for (const edge of edges) {
        const [, childNode] = edge.split("->");

        if (assignedChildren.has(childNode)) continue;

        assignedChildren.add(childNode);
        filteredEdges.push(edge);
    }

    return filteredEdges;
}

function buildGraph(edges) {
    const graph = {};

    for (const edge of edges) {
        const [parentNode, childNode] = edge.split("->");

        if (!graph[parentNode]) graph[parentNode] = [];
        if (!graph[childNode]) graph[childNode] = [];

        graph[parentNode].push(childNode);
    }

    return graph;
}

function findRootNodes(edges) {
    const allNodes = new Set();
    const childNodes = new Set();

    for (const edge of edges) {
        const [parentNode, childNode] = edge.split("->");

        allNodes.add(parentNode);
        allNodes.add(childNode);
        childNodes.add(childNode);
    }

    const roots = [...allNodes].filter(node => !childNodes.has(node));

    return roots.sort();
}

function hasCycle(graph) {
    const visited = new Set();
    const stack = new Set();

    function dfs(node) {
        if (stack.has(node)) return true;
        if (visited.has(node)) return false;

        visited.add(node);
        stack.add(node);

        for (const neighbour of graph[node] || []) {
            if (dfs(neighbour)) return true;
        }

        stack.delete(node);
        return false;
    }

    for (const node in graph) {
        if (dfs(node)) return true;
    }

    return false;
}

function createTree(graph, node) {
    const subtree = {};

    for (const child of graph[node] || []) {
        subtree[child] = createTree(graph, child);
    }

    return subtree;
}

function calculateDepth(graph, node) {
    if (!graph[node] || graph[node].length === 0) {
        return 1;
    }

    let maxDepth = 0;

    for (const child of graph[node]) {
        maxDepth = Math.max(maxDepth, calculateDepth(graph, child));
    }

    return maxDepth + 1;
}

function buildHierarchyObject(graph, rootNode) {
    const hierarchy = { root: rootNode };

    if (hasCycle(graph)) {
        hierarchy.tree = {};
        hierarchy.has_cycle = true;
        return hierarchy;
    }

    hierarchy.tree = {
        [rootNode]: createTree(graph, rootNode)
    };

    hierarchy.depth = calculateDepth(graph, rootNode);

    return hierarchy;
}

function findConnectedGroups(edges) {
    const graph = {};
    const allNodes = new Set();

    for (const edge of edges) {
        const [parentNode, childNode] = edge.split("->");

        allNodes.add(parentNode);
        allNodes.add(childNode);

        if (!graph[parentNode]) graph[parentNode] = [];
        if (!graph[childNode]) graph[childNode] = [];

        graph[parentNode].push(childNode);
        graph[childNode].push(parentNode);
    }

    const visited = new Set();
    const groups = [];

    for (const node of allNodes) {
        if (visited.has(node)) continue;

        const stack = [node];
        const group = [];

        while (stack.length) {
            const current = stack.pop();

            if (visited.has(current)) continue;

            visited.add(current);
            group.push(current);

            for (const neighbour of graph[current]) {
                if (!visited.has(neighbour)) {
                    stack.push(neighbour);
                }
            }
        }

        groups.push(group);
    }

    return groups;
}

function createSummary(hierarchies) {
    let totalTrees = 0;
    let totalCycles = 0;
    let largestTreeRoot = "";
    let maxDepth = -1;

    for (const hierarchy of hierarchies) {
        if (hierarchy.has_cycle) {
            totalCycles++;
        } else {
            totalTrees++;

            if (
                hierarchy.depth > maxDepth ||
                (hierarchy.depth === maxDepth &&
                    hierarchy.root < largestTreeRoot)
            ) {
                maxDepth = hierarchy.depth;
                largestTreeRoot = hierarchy.root;
            }
        }
    }

    return {
        total_trees: totalTrees,
        total_cycles: totalCycles,
        largest_tree_root: largestTreeRoot
    };
}

router.post("/", (req, res) => {
    const { data } = req.body;

    if (!Array.isArray(data)) {
        return res.status(400).json({
            error: "data must be an array"
        });
    }

    const validationResult = validateEntries(data);
    const duplicateResult = removeDuplicateEdges(validationResult.validEdges);
    const usableEdges = keepFirstParent(duplicateResult.uniqueEdges);

    const groups = findConnectedGroups(usableEdges);
    const hierarchies = [];

    for (const group of groups) {
        const groupEdges = usableEdges.filter(edge => {
            const [parentNode, childNode] = edge.split("->");
            return group.includes(parentNode) && group.includes(childNode);
        });

        const groupGraph = buildGraph(groupEdges);

        let roots = findRootNodes(groupEdges);

        if (roots.length === 0) {
            roots = [...group].sort();
        }

        hierarchies.push(
            buildHierarchyObject(groupGraph, roots[0])
        );
    }

    const summary = createSummary(hierarchies);

    res.status(200).json({
        user_id: "vanshikaraina_15092005",
        email_id: "vanshika0995.be23@chitkara.edu.in",
        college_roll_number: "2310990995",
        hierarchies,
        invalid_entries: validationResult.invalidEntries,
        duplicate_edges: duplicateResult.duplicateEdges,
        summary
    });
});

module.exports = router;