import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import { formService, adService } from './api';
import type { Ad, FormConfig, FormField } from './types';

// 系数常量
const MAGIC_COEFFICIENT = 0.42;

// 初始表单数据
const INITIAL_FORM_DATA: Ad = {
  title: '',
  publisher: '',
  content: '',
  landingUrl: '',
  price: ''
};

const AdWallApp: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState<boolean>(false);
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);

  // 表单状态
  const [currentAd, setCurrentAd] = useState<Ad>(INITIAL_FORM_DATA);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'copy'>('create');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // 加载广告数据和表单配置
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [formConfigRes, adsRes] = await Promise.all([
          formService.getConfig(),
          adService.getAll()
        ]);
        // console.log(formConfigRes.data);
        setFormConfig(formConfigRes.data || { fields: [] });
        setAds(Array.isArray(adsRes.data) ? adsRes.data : []);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- 核心逻辑 ---
  const calculateScore = (price: number | string, clicked: number = 0) => {
    const priceNum = typeof price === 'string' ? parseFloat(price) || 0 : price;
    return priceNum + (priceNum * clicked * MAGIC_COEFFICIENT);
  };

  const sortedAds = useMemo(() => {
    return [...ads].sort((a, b) => {
      const scoreA = calculateScore(a.price, a.clicked);
      const scoreB = calculateScore(b.price, b.clicked);
      return scoreB - scoreA;
    });
  }, [ads]);

  // --- 事件处理 ---
  const handleCardClick = async (ad: Ad) => {
    if (!ad.id) return;
    
    try {
      await adService.incrementClick(ad.id);
      const newAds = ads.map(item => {
        if (item.id === ad.id) {
          const currentClicks = typeof item.clicked === 'number' ? item.clicked : 0;
          return { ...item, clicked: currentClicks + 1 };
        }
        return item;
      });
      setAds(newAds);
      window.open(ad.landingUrl, '_blank');
    } catch (err: unknown) {
      console.error('Error incrementing click count:', err);
      alert('Failed to update click count');
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteAlertOpen(true);
  };

  const executeDelete = async () => {
    if (deleteId === null) return;
    
    try {
      await adService.delete(deleteId);
      setAds(ads.filter(ad => ad.id !== deleteId));
      setIsDeleteAlertOpen(false);
      setDeleteId(null);
    } catch (err: unknown) {
      console.error('Error deleting ad:', err);
      alert('Failed to delete ad');
    }
  };

  const openForm = (mode: 'create' | 'edit' | 'copy', ad: Ad | null = null) => {
    setFormMode(mode);
    if (mode === 'create') {
      setCurrentAd({ ...INITIAL_FORM_DATA });
    } else if ((mode === 'edit' || mode === 'copy') && ad) {
      setCurrentAd({ ...ad });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (formData: Ad) => {
    try {
      if (formMode === 'edit' && formData.id) {
        const updatedAd = await adService.update(formData.id, formData);
        setAds(ads.map(item => item.id === formData.id ? updatedAd.data : item));
      } else {
        const newAd = await adService.create({
          ...formData,
          clicked: 0
        });
        setAds([...ads, newAd.data]);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error saving ad:', err);
      alert(`Failed to ${formMode === 'edit' ? 'update' : 'create'} ad: ${errorMessage}`);
    }
  };

  return (
    <>
      {/* 顶部区域 */}
      <div className="page-header">
        <h1 className="page-title">Mini广告墙</h1>
      </div>

      <button className="btn btn-primary" onClick={() => openForm('create')}>
        + 新增广告
      </button>

      {/* 广告列表 */}
      {isLoading ? (
        <div className="loading">加载中...</div>
      ) : error ? (
        <div className="error">加载失败: {error}</div>
      ) : (
        <div className="ad-grid">
          {sortedAds.map(ad => (
            <AdCard
              key={ad.id}
              ad={ad}
              score={calculateScore(
                typeof ad.price === 'number' ? ad.price : 0,
                typeof ad.clicked === 'number' ? ad.clicked : 0
              )}
              onEdit={() => openForm('edit', ad)}
              onCopy={() => openForm('copy', ad)}
              onDelete={() => ad.id && confirmDelete(ad.id)}
              onClick={() => handleCardClick(ad)}
            />
          ))}
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      {/* {console.log('ModalCheck:', isModalOpen, formConfig)} */}
      {isModalOpen && formConfig && (
        <AdFormModal
          mode={formMode}
          initialData={currentAd}
          formConfig={formConfig}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {/* 删除确认弹窗 (复用 Modal 样式) */}
      {isDeleteAlertOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">删除确认</h3>
              <button className="modal-close" onClick={() => setIsDeleteAlertOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, padding: '10px 0' }}>确定要删除该广告吗？删除后不可恢复。</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setIsDeleteAlertOpen(false)}>取消</button>
              <button className="btn btn-primary" style={{ background: '#ff4d4f' }} onClick={executeDelete}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 广告卡片属性类型
interface AdCardProps {
  ad: Ad;
  score: number;
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onClick: () => void;
}

// --- 组件：广告卡片 ---
function AdCard({ ad, score, onEdit, onCopy, onDelete, onClick }: AdCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    setShowMenu(false);
  };

  return (
    <div className="ad-card" onClick={onClick}>
      <div className="card-header">
        <h3 className="card-title">{ad.title}</h3>

        {/* 操作下拉按钮 */}
        <div
          className="operation-wrapper"
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); console.log(e); }}
          onMouseLeave={() => setShowMenu(false)}
        >
          <button 
            type="button" 
            className="btn btn-text"
            // onClick={(e) => e.stopPropagation() }
          >
            操作
            {/* 简单的 SVG 下拉箭头 */}
            <svg viewBox="0 0 1024 1024" width="10" height="10" style={{ marginLeft: 6, fill: '#666' }}>
              <path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3 0.1-12.7-6.4-12.7z" />
            </svg>
          </button>

          {showMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={(e) => handleMenuClick(e, onEdit)}>编辑广告</div>
              <div className="dropdown-item" onClick={(e) => handleMenuClick(e, onCopy)}>复制广告</div>
              <div className="dropdown-item" onClick={(e) => handleMenuClick(e, onDelete)} style={{ color: 'var(--danger-color)' }}>删除广告</div>
            </div>
          )}
        </div>
      </div>

      <div className="card-content">{ad.content}</div>

      <div className="card-footer">
        <span className="stat-item">
          热度: <span className="heat-val">{Math.floor(score)}</span>
        </span>
        <span className="stat-item">
          出价: <span className="price-val">{ad.price}</span>
        </span>
      </div>
    </div>
  );
}


// --- 组件：表单弹窗 ---
function AdFormModal({ mode, initialData, formConfig, onClose, onSave }: {
  mode: 'create' | 'edit' | 'copy';
  initialData: Ad;
  formConfig: FormConfig;
  onClose: () => void;
  onSave: (data: Ad) => void;
}) {
  const [formData, setFormData] = useState<Ad>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    formConfig.fields.forEach(field => {
      if (field.required && !formData[field.name as keyof Ad]) {
        newErrors[field.name] = `${field.label}不能为空`;
      }
      
      if (field.pattern && formData[field.name as keyof Ad]) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(String(formData[field.name as keyof Ad]))) {
          newErrors[field.name] = `请输入有效的${field.label}`;
        }
      }
      
      if (field.maxLength && String(formData[field.name as keyof Ad] || '').length > field.maxLength) {
        newErrors[field.name] = `${field.label}不能超过${field.maxLength}个字符`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Convert price to number if it's a string
    const formDataToSave = {
      ...formData,
      price: typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price
    };
    
    onSave(formDataToSave);
  };

  const titleMap = {
    create: '新建广告',
    edit: '编辑广告',
    copy: '新建广告' // 复制时在UI上也通常显示新建
  };

  const renderFormField = (field: FormField) => {
    // 将 key 分离出来
    const { name, ...restFieldProps } = field;
    const commonProps = {
      name: name,
      value: formData[name as keyof Ad] || '',
      onChange: handleChange,
      placeholder: restFieldProps.placeholder || `请输入${restFieldProps.label}`,
      className: `form-input ${errors[name] ? 'error' : ''}`,
      maxLength: restFieldProps.maxLength,
      required: restFieldProps.required
    };

    return (
      <div className="form-item" key={name} style={restFieldProps.type === 'textarea' ? { alignItems: 'flex-start' } : {}}>
        <label className="form-label" style={restFieldProps.type === 'textarea' ? { marginTop: '6px' } : {}}>
          {restFieldProps.required && <span className="required">*</span>}
          {restFieldProps.label}
        </label>
        <div className="form-control-wrapper">
          {restFieldProps.type === 'textarea' ? (
            <textarea
              key={name} // 直接传递 key
              {...commonProps}
              className={`form-textarea ${errors[name] ? 'error' : ''}`}
              rows={4}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                key={name} // 直接传递 key
                type={restFieldProps.type}
                {...commonProps}
                style={name === 'price' ? { width: '120px' } : {}}
                min={restFieldProps.min}
                step={restFieldProps.step}
                pattern={restFieldProps.pattern}
              />
              {restFieldProps.suffix && <span className="suffix">{restFieldProps.suffix}</span>}
            </div>
          )}
          {errors[name] && (
            <div className="error-message">{errors[name]}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
                    <h3 className="modal-title">{titleMap[mode]}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {formConfig?.fields.map(field => renderFormField(field))}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-default" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary">
              {mode === 'edit' ? '更新广告' : '创建广告'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdWallApp;