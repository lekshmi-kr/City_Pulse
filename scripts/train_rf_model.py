import json
import numpy as np
from sklearn.ensemble import RandomForestClassifier

def generate_synthetic_dataset(n_samples=5000, random_state=42):
    np.random.seed(random_state)
    
    # Feature 0: rainfallMmPerHr (0 - 90 mm/hr)
    rainfall = np.random.exponential(scale=15, size=n_samples)
    rainfall = np.clip(rainfall, 0, 90)
    
    # Feature 1: trafficDensity (0 - 100 %)
    traffic = np.random.uniform(10, 95, size=n_samples)
    
    # Feature 2: footfallActivity (0 - 100 %)
    footfall = np.random.uniform(10, 95, size=n_samples)
    
    # Feature 3: sustainedRainMinutes (0 - 180 min)
    sustained = np.where(rainfall > 5, np.random.exponential(scale=40, size=n_samples), 0)
    sustained = np.clip(sustained, 0, 180)
    
    # Feature 4: isLowLyingZone (0 or 1)
    low_lying = np.random.choice([0, 1], size=n_samples, p=[0.4, 0.6])
    
    # Compute composite score for ground truth labeling
    score = (
        (rainfall / 20.0) * 2.5 +
        (sustained / 60.0) * 1.5 +
        (low_lying * 2.0) +
        (traffic / 40.0) * 1.0 +
        (footfall / 50.0) * 0.8
    )
    
    # Add light realistic noise
    score += np.random.normal(0, 0.5, size=n_samples)
    
    # Classify into LOW (0), MEDIUM (1), HIGH (2)
    labels = np.zeros(n_samples, dtype=int)
    labels[score >= 4.5] = 2  # HIGH
    labels[(score >= 2.5) & (score < 4.5)] = 1  # MEDIUM
    
    X = np.column_stack([rainfall, traffic, footfall, sustained, low_lying])
    return X, labels

def export_tree(tree_model):
    tree = tree_model.tree_
    nodes = []
    for i in range(tree.node_count):
        node = {
            "id": i,
            "feature": int(tree.feature[i]),
            "threshold": float(tree.threshold[i]),
            "left": int(tree.children_left[i]),
            "right": int(tree.children_right[i]),
            "value": tree.value[i][0].tolist()
        }
        nodes.append(node)
    return nodes

def main():
    print("Generating synthetic Trivandrum risk dataset (5,000 samples)...")
    X, y = generate_synthetic_dataset(5000, random_state=42)
    
    feature_names = [
        "rainfallMmPerHr",
        "trafficDensity",
        "footfallActivity",
        "sustainedRainMinutes",
        "isLowLyingZone"
    ]
    class_names = ["LOW", "MEDIUM", "HIGH"]
    
    print("Training RandomForestClassifier (10 estimators, max_depth=5)...")
    rf = RandomForestClassifier(n_estimators=10, max_depth=5, random_state=42)
    rf.fit(X, y)
    
    train_acc = rf.score(X, y)
    print(f"Model Training Accuracy: {train_acc * 100:.2f}%")
    
    # Format feature importances
    importances = {name: float(imp) for name, imp in zip(feature_names, rf.feature_importances_)}
    
    # Export individual decision trees
    trees = [export_tree(estimator) for estimator in rf.estimators_]
    
    model_export = {
        "modelName": "Trivandrum City Pulse Random Forest Classifier",
        "nEstimators": 10,
        "maxDepth": 5,
        "trainAccuracy": round(float(train_acc), 4),
        "featureNames": feature_names,
        "classNames": class_names,
        "featureImportances": importances,
        "trees": trees
    }
    
    output_path = "src/lib/trainedModelData.json"
    with open(output_path, "w") as f:
        json.dump(model_export, f, indent=2)
        
    print(f"Trained Random Forest model successfully exported to {output_path}")

if __name__ == "__main__":
    main()
