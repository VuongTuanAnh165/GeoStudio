<template>
  <div class="landing-page">
    <div class="hero">
      <h2 class="title">Bộ công cụ hình học tương tác chuyên nghiệp</h2>
      <p class="subtitle">
        Khám phá, giảng dạy và học tập toán học với bảng vẽ thông minh, hỗ trợ đa chiều (2D/3D), 
        công cụ dựng hình tự động và nhận diện cử chỉ.
      </p>
      
      <div class="actions">
        <NuxtLink to="/workspace" class="btn-primary">
          Bắt đầu ngay
          <Icon name="lucide:arrow-right" class="btn-icon" />
        </NuxtLink>
      </div>
    </div>
    
    <div class="features">
      <div class="feature-card">
        <Icon name="lucide:pen-tool" class="feature-icon" />
        <h3>Dựng hình mạnh mẽ</h3>
        <p>Hàng chục công cụ dựng hình tự động, hỗ trợ snap thông minh.</p>
      </div>
      <div class="feature-card">
        <Icon name="lucide:move-3d" class="feature-icon" />
        <h3>Không gian 3D</h3>
        <p>Hỗ trợ đầy đủ hệ tọa độ 3D và các khối hình học không gian.</p>
      </div>
      <div class="feature-card">
        <Icon name="lucide:hand" class="feature-icon" />
        <h3>Nhận diện cử chỉ</h3>
        <p>Điều khiển canvas bằng tay qua AI camera mà không cần chuột.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})
</script>

<style scoped>
.landing-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  max-width: 800px;
  margin-bottom: 4rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-color);
  margin-bottom: 1rem;
  line-height: 1.2;
}

.subtitle {
  font-size: 1.125rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 2.5rem;
}

.actions {
  display: flex;
  justify-content: center;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--primary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-decoration: none;
  font-size: 1.125rem;
  transition: background-color 0.2s, transform 0.2s;
  box-shadow: 0 4px 6px -1px rgba(0, 102, 204, 0.2), 0 2px 4px -1px rgba(0, 102, 204, 0.1);
}

.btn-primary:hover {
  background-color: #0052a3;
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 1.25rem;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  width: 100%;
}

.feature-card {
  background-color: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border-color);
  text-align: center;
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.feature-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
}

.feature-card p {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.5;
}
</style>
