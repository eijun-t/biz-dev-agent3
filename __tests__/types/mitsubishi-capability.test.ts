/**
 * Mitsubishi Capability Tests
 */

import {
  MITSUBISHI_CAPABILITIES,
  getAllCapabilities,
  getCapabilityByCategory,
  getFlatCapabilityList,
  getTotalAssetCount,
  generateCapabilityDescription,
} from '@/lib/types/mitsubishi-capability';

describe('Mitsubishi Capability Definitions', () => {
  describe('MITSUBISHI_CAPABILITIES', () => {
    it('should have all main categories defined', () => {
      expect(MITSUBISHI_CAPABILITIES.real_estate_development).toBeDefined();
      expect(MITSUBISHI_CAPABILITIES.operations).toBeDefined();
      expect(MITSUBISHI_CAPABILITIES.finance).toBeDefined();
      expect(MITSUBISHI_CAPABILITIES.innovation).toBeDefined();
      expect(MITSUBISHI_CAPABILITIES.group_synergy).toBeDefined();
    });

    it('should have correct structure for real_estate_development', () => {
      const realEstate = MITSUBISHI_CAPABILITIES.real_estate_development;
      
      expect(realEstate.category).toBe('real_estate_development');
      expect(realEstate.name).toBe('不動産開発・運営');
      expect(realEstate.capabilities).toHaveLength(4);
      
      const firstCapability = realEstate.capabilities[0];
      expect(firstCapability.name).toBe('大規模複合開発');
      expect(firstCapability.specificAssets).toBeDefined();
      expect(firstCapability.specificAssets?.length).toBeGreaterThan(0);
    });

    it('should have specific assets for operations category', () => {
      const operations = MITSUBISHI_CAPABILITIES.operations;
      const airportOps = operations.capabilities.find(c => c.name === '空港運営');
      
      expect(airportOps).toBeDefined();
      expect(airportOps?.specificAssets).toContain('高松空港');
      expect(airportOps?.specificAssets).toContain('福岡空港');
    });

    it('should have REIT information in finance category', () => {
      const finance = MITSUBISHI_CAPABILITIES.finance;
      const reit = finance.capabilities.find(c => c.name === 'REIT運用');
      
      expect(reit).toBeDefined();
      expect(reit?.specificAssets).toContain('日本ビルファンド（資産規模1.4兆円）');
    });

    it('should have innovation hubs in innovation category', () => {
      const innovation = MITSUBISHI_CAPABILITIES.innovation;
      const startupSupport = innovation.capabilities.find(c => c.name === 'スタートアップ支援');
      
      expect(startupSupport).toBeDefined();
      expect(startupSupport?.specificAssets).toContain('FINOLAB（フィンテック拠点）');
      expect(startupSupport?.specificAssets).toContain('xLINK（ライフサイエンス拠点）');
    });

    it('should have Mitsubishi Group companies in group_synergy', () => {
      const groupSynergy = MITSUBISHI_CAPABILITIES.group_synergy;
      const groupComp = groupSynergy.capabilities.find(c => c.name === '三菱グループ連携');
      
      expect(groupComp).toBeDefined();
      expect(groupComp?.specificAssets).toContain('三菱商事（総合商社）');
      expect(groupComp?.specificAssets).toContain('三菱UFJフィナンシャルグループ（金融）');
    });
  });

  describe('getAllCapabilities', () => {
    it('should return all capability groups', () => {
      const allCapabilities = getAllCapabilities();
      
      expect(allCapabilities).toHaveLength(5);
      expect(allCapabilities.map(c => c.category)).toContain('real_estate_development');
      expect(allCapabilities.map(c => c.category)).toContain('operations');
      expect(allCapabilities.map(c => c.category)).toContain('finance');
      expect(allCapabilities.map(c => c.category)).toContain('innovation');
      expect(allCapabilities.map(c => c.category)).toContain('group_synergy');
    });
  });

  describe('getCapabilityByCategory', () => {
    it('should return correct capability group for given category', () => {
      const realEstate = getCapabilityByCategory('real_estate_development');
      
      expect(realEstate.category).toBe('real_estate_development');
      expect(realEstate.name).toBe('不動産開発・運営');
    });

    it('should return different groups for different categories', () => {
      const operations = getCapabilityByCategory('operations');
      const finance = getCapabilityByCategory('finance');
      
      expect(operations.category).toBe('operations');
      expect(finance.category).toBe('finance');
      expect(operations).not.toBe(finance);
    });
  });

  describe('getFlatCapabilityList', () => {
    it('should return flattened list of all capabilities', () => {
      const flatList = getFlatCapabilityList();
      
      expect(flatList.length).toBeGreaterThan(0);
      
      const firstItem = flatList[0];
      expect(firstItem).toHaveProperty('category');
      expect(firstItem).toHaveProperty('categoryName');
      expect(firstItem).toHaveProperty('capability');
    });

    it('should include capabilities from all categories', () => {
      const flatList = getFlatCapabilityList();
      
      const categories = [...new Set(flatList.map(item => item.category))];
      expect(categories).toHaveLength(5);
    });

    it('should maintain capability structure', () => {
      const flatList = getFlatCapabilityList();
      
      const realEstateItems = flatList.filter(item => item.category === 'real_estate_development');
      expect(realEstateItems.length).toBe(4); // 4 capabilities in real estate
      
      const hasMarunouchiBuilding = realEstateItems.some(item => 
        item.capability.specificAssets?.includes('丸の内ビルディング')
      );
      expect(hasMarunouchiBuilding).toBe(true);
    });
  });

  describe('getTotalAssetCount', () => {
    it('should count all specific assets', () => {
      const totalAssets = getTotalAssetCount();
      
      expect(totalAssets).toBeGreaterThan(0);
      expect(typeof totalAssets).toBe('number');
    });

    it('should include assets from all categories', () => {
      const totalAssets = getTotalAssetCount();
      
      // We know there are at least:
      // - 10 buildings in real estate
      // - 5 airports in operations
      // - 3 REITs in finance
      // - 5 innovation hubs
      // - 7 group companies
      expect(totalAssets).toBeGreaterThanOrEqual(30);
    });
  });

  describe('generateCapabilityDescription', () => {
    it('should generate a comprehensive description', () => {
      const description = generateCapabilityDescription();
      
      expect(description).toContain('不動産開発・運営');
      expect(description).toContain('施設運営・サービス');
      expect(description).toContain('金融・投資');
      expect(description).toContain('イノベーション・新規事業');
      expect(description).toContain('グループシナジー');
    });

    it('should include capability names', () => {
      const description = generateCapabilityDescription();
      
      expect(description).toContain('大規模複合開発');
      expect(description).toContain('REIT運用');
      expect(description).toContain('スタートアップ支援');
    });

    it('should be formatted as a comma-separated list', () => {
      const description = generateCapabilityDescription();
      
      expect(description).toContain('、');
      expect(description.split('、').length).toBeGreaterThan(5);
    });
  });

  describe('Data integrity', () => {
    it('should have unique capability names within each category', () => {
      Object.values(MITSUBISHI_CAPABILITIES).forEach(group => {
        const names = group.capabilities.map(c => c.name);
        const uniqueNames = [...new Set(names)];
        expect(names.length).toBe(uniqueNames.length);
      });
    });

    it('should have valid category values', () => {
      const validCategories = ['real_estate_development', 'operations', 'finance', 'innovation', 'group_synergy'];
      
      Object.values(MITSUBISHI_CAPABILITIES).forEach(group => {
        expect(validCategories).toContain(group.category);
      });
    });

    it('should have non-empty descriptions for all capabilities', () => {
      Object.values(MITSUBISHI_CAPABILITIES).forEach(group => {
        group.capabilities.forEach(capability => {
          expect(capability.name).toBeTruthy();
          expect(capability.description).toBeTruthy();
        });
      });
    });
  });
});