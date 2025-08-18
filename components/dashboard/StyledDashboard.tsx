'use client'

import React, { useState } from 'react'
import { 
  TrendingUp, Users, FileText, Clock, Activity, 
  ArrowUp, ArrowDown, BarChart, 
  Zap, Target, CheckCircle, Brain, Sparkles
} from 'lucide-react'

const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '20px',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  border: '1px solid #e5e7eb',
  marginBottom: '16px',
  transition: 'box-shadow 0.3s',
}

const kpiCardStyle = {
  ...cardStyle,
  cursor: 'pointer',
}

export default function StyledDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  const kpiData = [
    { title: '総レポート数', value: '127', change: 12, icon: FileText, color: '#3b82f6', trend: 'up' },
    { title: 'アクティブプロジェクト', value: '18', change: 5, icon: Target, color: '#10b981', trend: 'up' },
    { title: 'エージェント稼働率', value: '92%', change: -3, icon: Activity, color: '#8b5cf6', trend: 'down' },
    { title: '平均処理時間', value: '2.3分', change: 15, icon: Clock, color: '#f97316', trend: 'up' },
  ]

  const agents = [
    { name: 'Researcher Agent', status: 'active', task: 'Web検索による市場調査実行中', performance: 95 },
    { name: 'Ideator Agent', status: 'active', task: 'ビジネスアイデア生成中', performance: 88 },
    { name: 'Critic Agent', status: 'idle', task: '評価待ち', performance: 92 },
    { name: 'Analyst Agent', status: 'idle', task: '分析待機中', performance: 90 },
    { name: 'Writer Agent', status: 'idle', task: 'レポート作成準備中', performance: 94 },
  ]

  return (
    <div style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold',
          background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px'
        }}>
          AI駆動型ダッシュボード
        </h1>
        <p style={{ color: '#6b7280' }}>プロジェクト概要とパフォーマンス分析</p>
      </div>

      {/* KPIカード */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <div key={index} style={kpiCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>{kpi.title}</span>
                <div style={{ 
                  backgroundColor: kpi.color, 
                  padding: '8px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={16} color="white" />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{kpi.value}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {kpi.trend === 'up' ? (
                  <ArrowUp size={14} color="#10b981" />
                ) : (
                  <ArrowDown size={14} color="#ef4444" />
                )}
                <span style={{ 
                  fontSize: '12px', 
                  color: kpi.trend === 'up' ? '#10b981' : '#ef4444'
                }}>
                  {kpi.change}% 前月比
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* タブ */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          gap: '4px',
          backgroundColor: '#e5e7eb',
          padding: '4px',
          borderRadius: '8px',
          width: 'fit-content'
        }}>
          {['overview', 'agents', 'projects'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: activeTab === tab ? 'white' : 'transparent',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? '500' : '400',
                boxShadow: activeTab === tab ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {tab === 'overview' ? '概要' : tab === 'agents' ? 'エージェント' : 'プロジェクト'}
            </button>
          ))}
        </div>
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          {/* 最近のアクティビティ */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="#3b82f6" />
              最近のアクティビティ
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={16} color="#10b981" />
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>レポート生成完了</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>ECサイト市場分析</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>2分前</span>
                </div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#f3f0ff', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Brain size={16} color="#8b5cf6" />
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>エージェント起動</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Researcher Agent</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>15分前</span>
                </div>
              </div>
            </div>
          </div>

          {/* パフォーマンスメトリクス */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="#10b981" />
              パフォーマンスメトリクス
            </h3>
            {[
              { label: '処理速度', value: 95 },
              { label: '精度', value: 88 },
              { label: '可用性', value: 99.9 },
              { label: 'コスト効率', value: 82 }
            ].map((metric, idx) => (
              <div key={idx} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px' }}>{metric.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{metric.value}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${metric.value}%`, 
                    height: '100%', 
                    backgroundColor: '#3b82f6',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'agents' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {agents.map((agent, index) => (
            <div key={index} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Brain size={20} color="#8b5cf6" />
                  <span style={{ fontWeight: '500' }}>{agent.name}</span>
                </div>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  backgroundColor: agent.status === 'active' ? '#10b981' : '#e5e7eb',
                  color: agent.status === 'active' ? 'white' : '#6b7280'
                }}>
                  {agent.status === 'active' ? '稼働中' : '待機中'}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>{agent.task}</p>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>パフォーマンス</span>
                  <span style={{ fontSize: '12px', fontWeight: '500' }}>{agent.performance}%</span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${agent.performance}%`, 
                    height: '100%', 
                    backgroundColor: '#8b5cf6'
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'projects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { title: 'ECサイト市場分析', progress: 75, status: 'active', deadline: '2024/01/20' },
            { title: 'スマートシティプロジェクト', progress: 45, status: 'active', deadline: '2024/01/25' },
            { title: 'ヘルスケアDX提案', progress: 30, status: 'waiting', deadline: '2024/02/01' },
          ].map((project, index) => (
            <div key={index} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: '500', marginBottom: '4px' }}>{project.title}</h4>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>期限: {project.deadline}</p>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>進捗</span>
                    <span style={{ fontSize: '12px', fontWeight: '500' }}>{project.progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${project.progress}%`, 
                      height: '100%', 
                      backgroundColor: '#3b82f6'
                    }} />
                  </div>
                </div>
              </div>
              <span style={{
                marginLeft: '20px',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                backgroundColor: project.status === 'active' ? '#3b82f6' : '#e5e7eb',
                color: project.status === 'active' ? 'white' : '#6b7280'
              }}>
                {project.status === 'active' ? '進行中' : '待機中'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}