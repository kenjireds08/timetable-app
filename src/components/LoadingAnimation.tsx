import { useState, useEffect } from 'react';
import { Brain, Zap, Clock, CheckCircle } from 'lucide-react';

interface LoadingAnimationProps {
  isVisible: boolean;
}

const LoadingAnimation = ({ isVisible }: LoadingAnimationProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    { icon: Brain, text: '制約条件を分析中...', color: '#3b82f6' },
    { icon: Zap, text: 'AI最適化アルゴリズム実行中...', color: '#8b5cf6' },
    { icon: Clock, text: '時間割パターンを計算中...', color: '#f59e0b' },
    { icon: CheckCircle, text: '完璧な時間割を生成完了！', color: '#10b981' }
  ];

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    // プログレスバーアニメーション
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 2; // 2%ずつ増加（50回で100%）
      });
    }, 60); // 60ms間隔

    // ステップ進行
    const stepTimer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) return steps.length - 1;
        return prev + 1;
      });
    }, 750); // 750ms間隔でステップ進行

    return () => {
      clearInterval(progressTimer);
      clearInterval(stepTimer);
    };
  }, [isVisible, steps.length]);

  if (!isVisible) return null;

  const CurrentIcon = steps[currentStep]?.icon || Brain;

  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="loading-header">
          <h2>🚀 AI時間割生成システム</h2>
          <p>高度な最適化計算を実行中...</p>
        </div>

        <div className="loading-animation">
          <div className="icon-container" style={{ color: steps[currentStep]?.color }}>
            <CurrentIcon size={64} className="spinning-icon" />
          </div>
          
          <div className="step-text">
            {steps[currentStep]?.text || '処理中...'}
          </div>

          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: steps[currentStep]?.color || '#3b82f6'
                }}
              />
            </div>
            <div className="progress-text">
              {Math.round(progress)}% 完了
            </div>
          </div>

          <div className="steps-indicator">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`step-dot ${index <= currentStep ? 'active' : ''}`}
                style={{ 
                  backgroundColor: index <= currentStep ? step.color : '#e5e7eb'
                }}
              />
            ))}
          </div>
        </div>

        <div className="loading-footer">
          <div className="loading-stats">
            <div className="stat-item">
              <span className="stat-number">248</span>
              <span className="stat-label">制約条件</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">1,024</span>
              <span className="stat-label">計算パターン</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">99.8%</span>
              <span className="stat-label">最適化率</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;