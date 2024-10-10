let svgDoc = null;

// 定义完整的状态转移规则（基于符号的路径）
const transitions = {
    "可借阅": { "a": "已借出", "b": "预约中", "d": "修复中", "e": "书籍将报废", "g": "遗失", "h": "馆藏保留" },
    "预约中": { "c": "可借阅", "f": "已借出", "i": "已借出" },
    "修复中": { "f": "可借阅", "e": "书籍将报废", "g": "遗失" },
    "馆藏保留": { "i": "可借阅", "d": "修复中", "e": "书籍将报废", "g": "遗失" },
    "书籍将报废": { "j": "已报废" },
    "已借出": { "c": "可借阅" },
    "遗失": {},
    "已报废": {}
};

// 监听SVG加载完成事件
document.getElementById("dfa-svg").addEventListener("load", function () {
    svgDoc = this.contentDocument; // 获取SVG的DOM文档
});

// 动画函数：根据状态名称执行圆圈放大、文字变色及线条颜色变红
function animateTransition(state) {
    if (!svgDoc) {
        console.error("SVG文件未正确加载，请确认路径或加载时机！");
        return;
    }

    // 查找目标节点
    const targetNode = Array.from(svgDoc.querySelectorAll("text")).find(text => text.textContent.trim() === state);
    if (targetNode) {
        const targetGroup = targetNode.parentNode;  // 找到文字对应的节点组
        const targetEllipse = targetGroup.querySelector("ellipse");  // 获取状态节点的圆圈（用 ellipse 表示）

        // 查找当前状态节点所有的边（连线）
        const relatedEdges = Array.from(svgDoc.querySelectorAll(".edge")).filter(edge => {
            const title = edge.querySelector("title");
            return title && title.textContent.includes(state);
        });

        // 文字变色和字体放大
        anime({
            targets: targetNode,
            fontSize: '20px',  // 文字变大
            duration: 800,
            easing: 'easeInOutQuad',
            complete: function () {
                targetNode.classList.add("active");  // 增加样式
            }
        });

        // 圆圈放大动画
        anime({
            targets: targetEllipse,
            rx: 50,  // 设置椭圆的横向半径为50（放大效果）
            ry: 50,  // 设置椭圆的纵向半径为50
            duration: 800,
            easing: 'easeInOutQuad',
            complete: function () {
                console.log(`状态 ${state} 已被激活`);
            }
        });

        // 设置相关连线的颜色变为红色
        relatedEdges.forEach(edge => {
            const path = edge.querySelector("path");
            const arrow = edge.querySelector("polygon");
            path.classList.add("highlight");  // 线条变红
            arrow.classList.add("highlight");  // 箭头变红
        });

        // 更新当前节点显示框
        document.getElementById("current-node").textContent = `当前节点: ${state}`;

    } else {
        console.error(`未找到状态 "${state}" 对应的节点！`);
    }
}

// 动态路径导航函数
async function navigatePath() {
    const pathInput = document.getElementById("path-input").value.trim();
    if (!pathInput) {
        alert("请输入有效的路径！");
        return;
    }

    const symbols = pathInput.split("-").map(n => n.trim());
    if (symbols.length < 1) {
        alert("路径需要至少包含一个转移符号！");
        return;
    }

    // 设置初始节点
    let currentNode = "可借阅";  // 从 "可借阅" 开始
    let currentPath = currentNode;

    // 动态更新路径展示
    for (let i = 0; i < symbols.length; i++) {
        const input = symbols[i];
        if (transitions[currentNode] && transitions[currentNode][input]) {
            const nextNode = transitions[currentNode][input];
            currentPath += ` -> ${nextNode} (${input})`;
            await animateTransition(nextNode);
            currentNode = nextNode;
            document.getElementById("path-display").textContent = `路径: ${currentPath}`;
        } else {
            alert(`无效的路径转移：${currentNode} -> ${input}`);
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));  // 每个节点之间等待1秒
    }

    // 设置目标节点
    document.getElementById("target-node").textContent = `目标节点: ${currentNode}`;
}
